"""
HTTP Poller — Generic REST API connector.

Polls ANY HTTP endpoint on an interval and converts the JSON response
into swarm signals using a user-provided transform function.

This replaces domain-specific connectors like CoinGecko or GitHub —
the developer defines what URL to hit and how to interpret the response.

Usage — Crypto prices:

    from ebbiforge.connectors import HTTPPoller, Signal

    def parse_crypto(data: dict) -> list[Signal]:
        btc = data.get("bitcoin", {})
        return [Signal(
            source="bitcoin",
            value=btc.get("usd_24h_change", 0) / 10.0,
            metadata={"price": btc.get("usd", 0)},
        )]

    feed = HTTPPoller(
        url="https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
        transform=parse_crypto,
    )

Usage — Weather:

    def parse_weather(data: dict) -> list[Signal]:
        temp = data["main"]["temp"]
        return [Signal(source="weather", value=(temp - 20) / 10.0)]

    feed = HTTPPoller(
        url="https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY&units=metric",
        transform=parse_weather,
    )
"""

import logging
import time
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("ebbiforge.connectors.http_poller")

from ebbiforge.connectors.base import DataSource, Signal

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


class HTTPPoller(DataSource):
    """
    Generic HTTP polling connector.

    Fetches JSON from any URL and transforms it into signals using
    a user-provided function. Includes caching and error resilience.

    Parameters
    ----------
    url : str
        The HTTP endpoint to poll
    transform : callable
        Function that takes the JSON response dict and returns a list of Signal objects
    headers : dict, optional
        HTTP headers to include in requests
    cache_ttl : float
        Minimum seconds between actual HTTP requests (default: 30)
    """

    def __init__(
        self,
        url: str,
        transform: Callable[[Dict[str, Any]], List[Signal]],
        headers: Optional[Dict[str, str]] = None,
        cache_ttl: float = 30.0,
    ):
        if not HAS_REQUESTS:
            raise ImportError(
                "HTTPPoller requires 'requests'. "
                "Install with: pip install ebbiforge[connectors]"
            )
        self._url = url
        self._transform = transform
        self._headers = headers or {"Accept": "application/json"}
        self._cache_ttl = cache_ttl
        self._cache: Optional[List[Signal]] = None
        self._cache_ts: float = 0

    def fetch(self) -> List[Signal]:
        """Fetch and transform the latest data from the HTTP endpoint."""
        now = time.time()
        if self._cache and (now - self._cache_ts) < self._cache_ttl:
            return self._cache

        try:
            resp = requests.get(self._url, headers=self._headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            signals = self._transform(data)
            self._cache = signals
            self._cache_ts = now
            return signals

        except Exception as e:
            logger.warning("HTTPPoller fetch failed for %s: %s", self._url, e)
            return self._cache or []
