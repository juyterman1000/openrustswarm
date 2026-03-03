"""
Webhook Output — POST swarm events to any URL.

Send swarm events to external services via HTTP POST.
Works with Slack webhooks, Discord webhooks, custom APIs,
PagerDuty, Zapier, IFTTT, or any HTTP endpoint.

Usage:
    from ebbiforge.outputs import WebhookOutput, SwarmEvent

    # Slack
    slack = WebhookOutput(url="https://hooks.slack.com/services/T.../B.../xxx")

    # Custom API
    api = WebhookOutput(
        url="https://my-api.com/events",
        headers={"Authorization": "Bearer my-token"},
    )
"""

import json
import logging
from typing import Dict, List, Optional

logger = logging.getLogger("ebbiforge.outputs.webhook")

from ebbiforge.outputs.base import OutputSink, SwarmEvent

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


class WebhookOutput(OutputSink):
    """
    HTTP webhook output adapter.

    POSTs swarm events as JSON to any URL. Supports custom headers
    for authentication.

    Parameters
    ----------
    url : str
        The endpoint to POST events to
    headers : dict, optional
        HTTP headers (e.g., auth tokens)
    min_severity : float
        Only emit events above this severity threshold (default: 0.0)
    batch_size : int
        If > 1, batch events before sending (default: 1)
    """

    def __init__(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        min_severity: float = 0.0,
        batch_size: int = 1,
    ):
        if not HAS_REQUESTS:
            raise ImportError(
                "WebhookOutput requires 'requests'. "
                "Install with: pip install ebbiforge[connectors]"
            )
        self._url = url
        self._headers = headers or {"Content-Type": "application/json"}
        if "Content-Type" not in self._headers:
            self._headers["Content-Type"] = "application/json"
        self._min_severity = min_severity
        self._batch_size = batch_size
        self._buffer: List[SwarmEvent] = []

    def emit(self, event: SwarmEvent):
        """POST an event to the webhook URL."""
        if event.severity < self._min_severity:
            return

        if self._batch_size > 1:
            self._buffer.append(event)
            if len(self._buffer) >= self._batch_size:
                self._flush()
        else:
            self._send([event])

    def emit_batch(self, events: List[SwarmEvent]):
        """Send a batch of events."""
        filtered = [e for e in events if e.severity >= self._min_severity]
        if filtered:
            self._send(filtered)

    def close(self):
        """Flush any remaining buffered events."""
        if self._buffer:
            self._flush()

    def _flush(self):
        self._send(self._buffer)
        self._buffer = []

    def _send(self, events: List[SwarmEvent]):
        try:
            payload = [e.to_dict() for e in events]
            requests.post(
                self._url,
                headers=self._headers,
                data=json.dumps(payload if len(payload) > 1 else payload[0]),
                timeout=5,
            )
        except Exception as e:
            logger.warning("WebhookOutput send failed to %s: %s", self._url, e)
