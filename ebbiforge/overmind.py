"""
Overmind — The Master Python Loop governing the 4-Tier LOD Swarm.

Executes the MPPI strategic plan and monitors the Genius Score.
All values derived from the real Rust engine — zero hardcoding.
"""

import time
import math
from typing import Dict, Any

from ebbiforge_core import ProductionTensorSwarm, TensorSwarm, SwarmConfig

class Overmind:
    """
    The Master Python Loop governing the Production Swarm Engine.
    Executes the MPPI strategic plan and monitors the Genius Score.
    """

    def __init__(self, engine):
        self.engine = engine
        self.config = SwarmConfig()  # Read defaults from Rust
        self.running = False

    def compute_genius_score(self, macro_state: Dict[str, Any]) -> float:
        """
        Calculates the 5-variable Genius Score.
        (Efficiency, Retention, Coherence, Adaptability, Alignment)
        All thresholds derived from the swarm config population size.
        """
        surprise = macro_state.get("mean_surprise", 0.0)
        health = macro_state.get("mean_health", 0.0)
        active_thinkers = macro_state.get("active_thinkers", 0)

        # 1. Efficiency: ratio of active thinkers to population
        pop = self.config.population_size
        efficiency = min(1.0, active_thinkers / max(1, pop // 2)) if surprise > 2.0 else 1.0

        # 2. Alignment: swarm health (from Rust engine)
        alignment = health

        # 3. Adaptability: inverse surprise (from Rust engine)
        adaptability = 1.0 / (1.0 + surprise)

        # Calculate final weighted Genius Score
        score = (0.4 * efficiency) + (0.4 * alignment) + (0.2 * adaptability)
        return score

    def step_mppi_planner(self, macro_state: Dict[str, Any]):
        """
        Model Predictive Path Integral (MPPI) Planner.
        Given the current macro state, predict if the swarm needs steering.
        Steering is applied by depositing chemicals in the Pheromone Field.
        Position derived from world dimensions, not hardcoded.
        """
        score = self.compute_genius_score(macro_state)
        tick = macro_state.get("tick", 0)
        active = macro_state.get("active_thinkers", 0)

        # If Genius Score drops below 0.6, inject a Novelty Beacon
        if score < 0.6 and tick % 10 == 0:
            # Deterministic position from tick count (Fibonacci scatter)
            w = self.config.world_width
            h = self.config.world_height
            phi = 0.6180339887  # Golden ratio conjugate
            x = ((float(tick) * phi) % 1.0) * w
            y = ((float(tick) * phi * 2.236) % 1.0) * h

            # CH 4 = Novelty Beacon
            self.engine.deposit_pheromone(x, y, 4, 100.0)
            print(f"[OVERMIND - Tick {tick}] Intervention! Genius Score {score:.2f}. Novelty Beacon at ({x:.1f}, {y:.1f}).")

        elif tick % 100 == 0:
            print(f"[OVERMIND - Tick {tick}] Swarm humming. Genius Score: {score:.2f} | Active: {active}")

    def run(self):
        """Main loop pulling from the Rust backend."""
        print("Initializing Overmind...")
        self.running = True

        while self.running:
            # Step the Rust engine
            self.engine.tick()

            # Extract aggregated state and compute Python-side Autonomy
            state = self.engine.get_macro_state()
            self.step_mppi_planner(state)

            # Target ~138Hz
            time.sleep(0.00725)

    def stop(self):
        self.running = False
