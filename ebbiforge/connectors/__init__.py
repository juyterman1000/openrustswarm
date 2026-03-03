"""
Ebbiforge Connectors — Plug-and-play data source adapters.

The core abstraction is `DataSource` — an interface that any developer
can implement to feed their own real-world data into the swarm.

Built-in connectors are EXAMPLES showing the pattern. Developers are
expected to write their own for their specific domain.

Usage (custom connector):

    from ebbiforge.connectors import DataSource, Signal

    class MyStockFeed(DataSource):
        def fetch(self) -> list[Signal]:
            price = my_api.get_price("AAPL")
            return [Signal(source="AAPL", value=price.change_pct, weight=0.5)]

    feed = MyStockFeed()
    signals = feed.fetch()
    for s in signals:
        engine.inject_signal(x=250, y=400, intensity=s.intensity)

Built-in examples:
    - HTTPPoller: Poll any REST API on an interval
    - WebhookReceiver: Receive signals via HTTP POST
    - RSSFeed: Ingest any RSS/Atom feed
"""

from ebbiforge.connectors.base import DataSource, Signal
from ebbiforge.connectors.http_poller import HTTPPoller
from ebbiforge.connectors.webhook import WebhookReceiver
from ebbiforge.connectors.rss_feed import RSSFeed

__all__ = [
    "DataSource",
    "Signal",
    "HTTPPoller",
    "WebhookReceiver",
    "RSSFeed",
]
