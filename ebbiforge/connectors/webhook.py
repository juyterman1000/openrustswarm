"""
Webhook Receiver — Accept external signals via HTTP POST.

Runs a lightweight HTTP server in a background thread. External
systems POST JSON signals which are queued for swarm consumption.

This is domain-agnostic — ANY system that can send HTTP POST can
feed data into your swarm (Stripe webhooks, Slack events, IoT gateways,
game servers, monitoring alerts, etc.).

Usage:
    from ebbiforge.connectors import WebhookReceiver, Signal

    receiver = WebhookReceiver(port=9090)
    receiver.start()

    # External system POSTs to http://localhost:9090/signal:
    # {"source": "payment", "value": 0.8, "weight": 0.5}

    signals = receiver.drain()  # Get all pending signals
"""

import json
import threading
from collections import deque
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import List, Optional

from ebbiforge.connectors.base import DataSource, Signal


class _WebhookHandler(BaseHTTPRequestHandler):
    """Internal HTTP handler."""

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body)

            # Accept either a single signal or a batch
            items = payload if isinstance(payload, list) else [payload]
            for item in items:
                signal = Signal(
                    source=item.get("source", "webhook"),
                    value=float(item.get("value", 0.0)),
                    weight=float(item.get("weight", 1.0)),
                    metadata={k: v for k, v in item.items()
                              if k not in ("source", "value", "weight")},
                )
                self.server._signal_queue.append(signal)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "accepted",
                "count": len(items),
            }).encode())
        except (json.JSONDecodeError, ValueError) as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        pass  # Suppress default logging


class WebhookReceiver(DataSource):
    """
    HTTP webhook receiver for external signal ingestion.

    Runs a background HTTP server. Any system that can POST JSON
    can feed signals into your swarm.

    Parameters
    ----------
    port : int
        Port to listen on (default: 9090)
    host : str
        Bind address (default: "0.0.0.0")
    max_queue : int
        Maximum pending signals before oldest are dropped (default: 10000)
    """

    def __init__(self, port: int = 9090, host: str = "0.0.0.0", max_queue: int = 10000):
        self._port = port
        self._host = host
        self._server: Optional[HTTPServer] = None
        self._thread: Optional[threading.Thread] = None
        self._queue: deque = deque(maxlen=max_queue)

    def start(self):
        """Start the webhook listener in a background thread."""
        self._server = HTTPServer((self._host, self._port), _WebhookHandler)
        self._server._signal_queue = self._queue
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the webhook listener."""
        if self._server:
            self._server.shutdown()

    def fetch(self) -> List[Signal]:
        """Return all pending signals (non-destructive peek)."""
        return list(self._queue)

    def drain(self) -> List[Signal]:
        """Drain all pending signals from the queue (destructive)."""
        signals = list(self._queue)
        self._queue.clear()
        return signals

    @property
    def pending_count(self) -> int:
        return len(self._queue)
