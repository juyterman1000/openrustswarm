"""
Ebbiforge Outputs — Plug-and-play output adapters.

The core abstraction is `OutputSink` — an interface that developers
implement to send swarm results anywhere.

Built-in adapters:
    - ConsoleOutput: Rich terminal output with live metrics
    - WebhookOutput: POST results to any URL
    - JSONFileOutput: Append results to a JSONL file

Usage (custom output):

    from ebbiforge.outputs import OutputSink

    class SlackOutput(OutputSink):
        def __init__(self, webhook_url):
            self.url = webhook_url

        def emit(self, event):
            requests.post(self.url, json={"text": str(event)})
"""

from ebbiforge.outputs.base import OutputSink, SwarmEvent
from ebbiforge.outputs.console import ConsoleOutput
from ebbiforge.outputs.webhook_out import WebhookOutput
from ebbiforge.outputs.jsonfile import JSONFileOutput

__all__ = [
    "OutputSink",
    "SwarmEvent",
    "ConsoleOutput",
    "WebhookOutput",
    "JSONFileOutput",
]
