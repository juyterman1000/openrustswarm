"""
Ebbiforge — High-level Python API wrapping the Rust ebbiforge_core engine.

These classes provide Pythonic interfaces over the compiled Rust bindings.
All computation happens in the Rust engine — zero Python fallbacks.
"""
import ebbiforge_core as ors
from ebbiforge_core import ProductionTensorSwarm, SharedMemoryStore, AgentGraphPy, HistoryBuffer


class Swarm(ProductionTensorSwarm):
    """High-level swarm interface with default configuration."""
    def __init__(self, agent_count=10000, world_config=None, config=None):
        super().__init__(agent_count=agent_count, world_config=world_config, config=config)


class Memory(SharedMemoryStore):
    """High-level memory interface wrapping Rust SharedMemoryStore."""
    def __init__(self):
        super().__init__()


class Runtime(AgentGraphPy):
    """Execution runtime wrapping the Rust AgentGraphPy."""
    def execute(self, task, timeout=10.0):
        return self.spawn_task(task.prompt, HistoryBuffer(), agent_name="DefaultAgent")

    def get_last_decomposition(self):
        return None
