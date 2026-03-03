"""
RSS Feed Connector — Ingest any RSS/Atom feed as signals.

Domain-agnostic: works with news feeds, release notes, blog posts,
monitoring alerts published via RSS, or any other RSS/Atom source.

Usage:
    from ebbiforge.connectors import RSSFeed

    feed = RSSFeed(
        url="https://hnrss.org/newest?points=100",
        transform=lambda entry: Signal(
            source="hackernews",
            value=len(entry["summary"]) / 500.0,  # longer = more significant
            metadata={"title": entry["title"], "link": entry["link"]},
        ),
    )
    signals = feed.fetch()
"""

import logging
import time
import xml.etree.ElementTree as ET
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("ebbiforge.connectors.rss_feed")

from ebbiforge.connectors.base import DataSource, Signal

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


def _default_transform(entry: Dict[str, Any]) -> Signal:
    """Default: signal intensity proportional to summary length."""
    return Signal(
        source="rss",
        value=min(1.0, len(entry.get("summary", "")) / 500.0),
        metadata=entry,
    )


class RSSFeed(DataSource):
    """
    RSS/Atom feed connector.

    Fetches and parses any RSS/Atom feed, converting entries into
    signals using a user-provided transform function.

    Parameters
    ----------
    url : str
        The RSS/Atom feed URL
    transform : callable, optional
        Function taking a dict (title, link, published, summary) and returning a Signal.
        Default: intensity proportional to summary length.
    cache_ttl : float
        Minimum seconds between fetches (default: 300)
    """

    def __init__(
        self,
        url: str,
        transform: Optional[Callable[[Dict[str, Any]], Signal]] = None,
        cache_ttl: float = 300.0,
    ):
        if not HAS_REQUESTS:
            raise ImportError(
                "RSSFeed connector requires 'requests'. "
                "Install with: pip install ebbiforge[connectors]"
            )
        self._url = url
        self._transform = transform or _default_transform
        self._cache_ttl = cache_ttl
        self._cache: Optional[List[Signal]] = None
        self._cache_ts: float = 0
        self._seen_links: set = set()

    def fetch(self) -> List[Signal]:
        """Fetch latest feed entries and convert to signals."""
        now = time.time()
        if self._cache and (now - self._cache_ts) < self._cache_ttl:
            return self._cache

        try:
            resp = requests.get(self._url, timeout=10)
            resp.raise_for_status()

            entries = self._parse_feed(resp.text)
            signals = [self._transform(e) for e in entries]

            self._cache = signals
            self._cache_ts = now
            return signals

        except Exception as e:
            logger.warning("RSSFeed fetch failed for %s: %s", self._url, e)
            return self._cache or []

    def fetch_new(self) -> List[Signal]:
        """Return only signals from entries not seen before."""
        all_signals = self.fetch()
        new = []
        for s in all_signals:
            link = s.metadata.get("link", "")
            if link and link not in self._seen_links:
                self._seen_links.add(link)
                new.append(s)
        return new

    @staticmethod
    def _parse_feed(xml_text: str, max_entries: int = 20) -> List[Dict[str, Any]]:
        """Parse RSS 2.0 or Atom XML into entry dicts."""
        root = ET.fromstring(xml_text)
        entries = []

        # RSS 2.0
        for item in root.findall(".//item")[:max_entries]:
            entries.append({
                "title": item.findtext("title", ""),
                "link": item.findtext("link", ""),
                "published": item.findtext("pubDate", ""),
                "summary": (item.findtext("description", "") or "")[:500],
            })

        # Atom
        if not entries:
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            for item in root.findall(".//atom:entry", ns)[:max_entries]:
                link_el = item.find("atom:link", ns)
                entries.append({
                    "title": item.findtext("atom:title", "", ns),
                    "link": link_el.get("href", "") if link_el is not None else "",
                    "published": item.findtext("atom:published", "", ns),
                    "summary": (item.findtext("atom:summary", "", ns) or "")[:500],
                })

        return entries
