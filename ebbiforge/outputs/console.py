"""
Console Output — Rich terminal display for swarm events.

Provides a formatted, color-coded terminal output with live metrics.
Useful for development, demos, and monitoring.

Usage:
    from ebbiforge.outputs import ConsoleOutput, SwarmEvent

    console = ConsoleOutput(verbose=True)
    console.emit(SwarmEvent(
        event_type="anomaly",
        message="Surprise cascade detected in sector 7",
        severity=0.85,
        tick=1500,
    ))
"""

import os
import sys
import time
from typing import TextIO

from ebbiforge.outputs.base import OutputSink, SwarmEvent


def _supports_ansi(stream) -> bool:
    """Detect if the output stream supports ANSI color codes."""
    if os.environ.get("NO_COLOR"):
        return False
    if not hasattr(stream, "isatty"):
        return False
    if not stream.isatty():
        return False
    if sys.platform == "win32":
        # Windows 10+ supports ANSI in modern terminals
        return os.environ.get("WT_SESSION") is not None or "ANSICON" in os.environ
    return True


# ANSI color codes
_COLORS = {
    "reset": "\033[0m",
    "red": "\033[91m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "blue": "\033[94m",
    "magenta": "\033[95m",
    "cyan": "\033[96m",
    "bold": "\033[1m",
    "dim": "\033[2m",
}

_SEVERITY_COLORS = [
    (0.8, "red"),
    (0.5, "yellow"),
    (0.2, "cyan"),
    (0.0, "dim"),
]

_EVENT_ICONS = {
    "anomaly": "🚨",
    "evolution": "🧬",
    "promotion": "🚀",
    "alert": "⚠️ ",
    "cascade": "🌊",
    "death": "💀",
    "birth": "🐣",
    "compliance": "⚖️ ",
    "narration": "🧠",
    "signal": "📡",
}


class ConsoleOutput(OutputSink):
    """
    Rich terminal output for swarm events.

    Color-codes events by severity and adds contextual icons.
    Supports verbose mode for detailed event data.

    Parameters
    ----------
    verbose : bool
        If True, print event data payloads (default: False)
    stream : TextIO
        Output stream (default: sys.stdout)
    show_timestamp : bool
        If True, prefix events with timestamp (default: True)
    """

    def __init__(
        self,
        verbose: bool = False,
        stream: TextIO = None,
        show_timestamp: bool = True,
        force_color: bool = False,
    ):
        self._verbose = verbose
        self._stream = stream or sys.stdout
        self._show_timestamp = show_timestamp
        self._event_count = 0
        self._use_color = force_color or _supports_ansi(self._stream)

    def emit(self, event: SwarmEvent):
        """Print a formatted event to the terminal."""
        self._event_count += 1

        def _c(code: str) -> str:
            """Return ANSI code if colors are enabled, empty string otherwise."""
            return _COLORS.get(code, "") if self._use_color else ""

        # Pick color by severity
        color = "dim"
        for threshold, c in _SEVERITY_COLORS:
            if event.severity >= threshold:
                color = c
                break

        # Pick icon by event type
        icon = _EVENT_ICONS.get(event.event_type, "📋")

        # Build output line
        parts = []
        if self._show_timestamp:
            ts = time.strftime("%H:%M:%S")
            parts.append(f"{_c('dim')}[{ts}]{_c('reset')}")

        parts.append(f"{_c('dim')}T{event.tick:<5}{_c('reset')}")
        parts.append(icon)
        parts.append(f"{_c(color)}{event.message}{_c('reset')}")

        line = " ".join(parts)
        print(line, file=self._stream)

        if self._verbose and event.data:
            data_str = "  " + str(event.data)
            print(f"{_c('dim')}{data_str}{_c('reset')}", file=self._stream)

    @property
    def event_count(self) -> int:
        return self._event_count
