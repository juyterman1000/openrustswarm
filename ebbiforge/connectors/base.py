"""
Base abstractions for Ebbiforge connectors.

`DataSource` is the interface every connector implements.
`Signal` is the universal unit of data flowing into the swarm.

Developers subclass `DataSource` and implement `fetch()` to
connect ANY external system — stocks, IoT sensors, game servers,
social media, databases, whatever.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Signal:
    """
    The universal unit of external data flowing into the swarm.

    This is domain-agnostic by design. A Signal could represent:
    - A stock price change
    - A temperature sensor reading
    - A customer support ticket
    - A game event
    - A social media mention

    Parameters
    ----------
    source : str
        Identifier for where this signal came from (e.g., "AAPL", "sensor-12", "slack")
    value : float
        The raw value (interpretation depends on your domain)
    weight : float
        How strongly this signal should affect the swarm [0.0 - 1.0]
    metadata : dict
        Any additional context you want to attach
    """
    source: str
    value: float
    weight: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def intensity(self) -> float:
        """Signal intensity for swarm injection = value × weight, clamped to [-1, 1]."""
        return max(-1.0, min(1.0, self.value * self.weight))


class DataSource(ABC):
    """
    Abstract interface for all data connectors.

    Subclass this and implement `fetch()` to connect any external
    system to the swarm.

    Example — Custom stock feed:

        class StockFeed(DataSource):
            def __init__(self, ticker: str):
                self.ticker = ticker

            def fetch(self) -> list[Signal]:
                data = my_stock_api.get(self.ticker)
                return [Signal(
                    source=self.ticker,
                    value=data.change_pct / 10.0,  # normalize
                    weight=0.5,
                    metadata={"price": data.price, "volume": data.volume},
                )]

    Example — IoT sensor:

        class TemperatureSensor(DataSource):
            def fetch(self) -> list[Signal]:
                reading = sensor.read()
                anomaly = abs(reading - 22.0) / 10.0  # deviation from 22°C
                return [Signal(source="temp-1", value=anomaly, weight=0.3)]
    """

    @abstractmethod
    def fetch(self) -> List[Signal]:
        """
        Fetch the latest signals from this data source.

        Returns a list of Signal objects. Called by the swarm engine
        on each tick (or at a configured interval).
        """
        ...

    def stream(self, interval: float = 30.0):
        """
        Generator that yields signal batches at regular intervals.

        Usage:
            for signals in feed.stream(interval=15):
                for s in signals:
                    engine.inject_signal(250, 400, s.intensity)
        """
        import time
        while True:
            yield self.fetch()
            time.sleep(interval)
