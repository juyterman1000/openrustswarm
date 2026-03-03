"""
Base abstractions for Ebbiforge outputs.

`OutputSink` is the interface every output adapter implements.
`SwarmEvent` is the universal output payload from the swarm.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class SwarmEvent:
    """
    A discrete event emitted by the swarm engine.

    This is domain-agnostic. A SwarmEvent could represent:
    - An anomaly detection alert
    - A generation transition
    - A surprise cascade
    - A promoted agent's LLM output
    - A compliance violation

    Parameters
    ----------
    event_type : str
        Category of event (e.g., "anomaly", "evolution", "promotion", "alert")
    message : str
        Human-readable description
    severity : float
        How significant this event is [0.0 - 1.0]
    data : dict
        Structured data payload
    tick : int
        Which simulation tick this occurred on
    """
    event_type: str
    message: str
    severity: float = 0.5
    data: Dict[str, Any] = field(default_factory=dict)
    tick: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type,
            "message": self.message,
            "severity": self.severity,
            "data": self.data,
            "tick": self.tick,
        }


class OutputSink(ABC):
    """
    Abstract interface for all output adapters.

    Subclass this and implement `emit()` to send swarm events
    anywhere — Slack, Discord, WhatsApp, PagerDuty, your own API.

    Example — Slack:

        class SlackOutput(OutputSink):
            def __init__(self, webhook_url):
                self.url = webhook_url

            def emit(self, event: SwarmEvent):
                emoji = "🚨" if event.severity > 0.8 else "📊"
                requests.post(self.url, json={
                    "text": f"{emoji} {event.message}"
                })

    Example — PagerDuty:

        class PagerDutyOutput(OutputSink):
            def emit(self, event: SwarmEvent):
                if event.severity > 0.9:
                    pagerduty.trigger(event.message)
    """

    @abstractmethod
    def emit(self, event: SwarmEvent):
        """Send a swarm event to this output destination."""
        ...

    def emit_batch(self, events: List[SwarmEvent]):
        """Send multiple events. Override for batch-optimized outputs."""
        for event in events:
            self.emit(event)

    def close(self):
        """Clean up resources. Override if needed."""
        pass
