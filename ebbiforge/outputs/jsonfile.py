"""
JSON File Output — Append swarm events to a JSONL file.

Writes events as newline-delimited JSON, perfect for log analysis,
data pipelines, or feeding into downstream ML systems.

Usage:
    from ebbiforge.outputs import JSONFileOutput

    logger = JSONFileOutput("swarm_events.jsonl")
    # ... events are appended as they occur
    logger.close()
"""

import json
import logging
import threading
import time
from typing import Optional, TextIO

from ebbiforge.outputs.base import OutputSink, SwarmEvent

logger = logging.getLogger("ebbiforge.outputs.jsonfile")


class JSONFileOutput(OutputSink):
    """
    Newline-delimited JSON file output.

    Appends each event as a single JSON line, making it easy to
    process with standard tools (jq, pandas, etc.).

    Thread-safe: uses a lock to prevent interleaved writes from
    concurrent callers.

    Parameters
    ----------
    path : str
        Path to the output file
    append : bool
        If True, append to existing file (default: True)
    flush_every : int
        Flush to disk every N events (default: 10)
    """

    def __init__(self, path: str, append: bool = True, flush_every: int = 10):
        self._path = path
        self._flush_every = flush_every
        self._count = 0
        self._lock = threading.Lock()
        self._closed = False

        try:
            mode = "a" if append else "w"
            self._file: TextIO = open(path, mode)
        except OSError as e:
            raise RuntimeError(f"Cannot open output file '{path}': {e}") from e

    def emit(self, event: SwarmEvent):
        """Append an event as a JSON line (thread-safe)."""
        if self._closed:
            logger.warning("JSONFileOutput.emit() called after close()")
            return

        with self._lock:
            try:
                record = event.to_dict()
                record["_ts"] = time.time()
                self._file.write(json.dumps(record) + "\n")
                self._count += 1

                if self._count % self._flush_every == 0:
                    self._file.flush()
            except OSError as e:
                logger.warning("JSONFileOutput write failed: %s", e)

    def close(self):
        """Flush and close the file."""
        if self._closed:
            return
        with self._lock:
            try:
                self._file.flush()
                self._file.close()
            except OSError as e:
                logger.warning("JSONFileOutput close failed: %s", e)
            finally:
                self._closed = True

    @property
    def event_count(self) -> int:
        return self._count

    def __del__(self):
        """Safety net: close file if not explicitly closed."""
        if not self._closed:
            try:
                self.close()
            except Exception:
                pass
