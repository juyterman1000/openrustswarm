"""
Ebbiforge — Example 04: Two-Tier Selective Reasoning
========================================================

The architectural differentiator: 100K cheap Rust agents detect
anomalies. Only when the swarm detects something interesting does
an expensive LLM agent get called.

This is "selective reasoning" — the LLM is a consultant, not a worker.
99.99% of computation is zero-cost Rust. The 0.01% that needs
intelligence gets Gemini.

Run: python examples/04_selective_reasoning.py
  or: ebbiforge example reasoning
"""

try:
    import ebbiforge_core as cogops
except ImportError:
    print("❌ Rust core required. Build with: maturin develop --release")
    exit(1)

import time
import os

# ── Initialize large-scale swarm ──────────────────────────────────
print("🧠 Ebbiforge — Two-Tier Selective Reasoning")
print("=" * 50)

AGENT_COUNT = 50_000
print(f"Tier 1 (Rust):   {AGENT_COUNT:,} lightweight agents — $0 cost")
print(f"Tier 2 (LLM):    On-demand Gemini — only when needed")
print()

world_config = cogops.WorldModelConfig(
    ebbinghaus_decay_rate=0.1,
    grid_size=(200, 200),
)

swarm = cogops.TensorSwarm(
    agent_count=AGENT_COUNT,
    world_config=world_config,
)

swarm.register_locations(
    villages=[(50, 50), (150, 50), (50, 150), (150, 150)],
    towns=[(100, 100)],
    cities=[(100, 100)],
    ambush_zones=[(75, 75), (125, 125)],
)

# ── Two-tier detection loop ───────────────────────────────────────
llm_calls = 0
SURPRISE_THRESHOLD = 0.05  # 5% of swarm surprised = escalate to LLM

print("Running 1000 ticks. LLM is called ONLY when anomaly detected.\n")

for tick in range(1000):
    start = time.time()

    # Inject surprise events periodically (simulating external signals)
    if tick == 200:
        print(f"  ⚡ [Tick {tick}] Injecting shock at (100, 100)...")
        swarm.apply_environmental_shock(location=(100, 100), radius=15, intensity=1.0)
    if tick == 600:
        print(f"  ⚡ [Tick {tick}] Injecting shock at (75, 75)...")
        swarm.apply_environmental_shock(location=(75, 75), radius=20, intensity=0.8)

    swarm.tick()
    elapsed = (time.time() - start) * 1000

    # ── Tier 1: Cheap anomaly detection (runs every tick) ─────────
    surprise_scores = swarm.surprise_scores
    surprised_count = sum(1 for s in surprise_scores if s > 0.3)
    total = len(surprise_scores)
    surprise_ratio = surprised_count / total if total > 0 else 0

    # ── Tier 2: Expensive LLM reasoning (only on anomaly) ─────────
    if surprise_ratio > SURPRISE_THRESHOLD:
        llm_calls += 1
        mean_surprise = sum(surprise_scores) / len(surprise_scores)

        # In production, this would call Gemini/GPT via AgentGraph
        narration = (
            f"Anomaly detected: {surprised_count:,} agents ({surprise_ratio*100:.1f}%) "
            f"in surprise state. Mean surprise: {mean_surprise:.4f}. "
            f"Cascade is {'spreading' if surprise_ratio > 0.1 else 'contained'}."
        )

        print(f"  🧠 [Tick {tick}] LLM CALLED (#{llm_calls}): {narration}")

    # Periodic status
    if tick % 200 == 0:
        mean_h = sum(swarm.health) / total
        print(
            f"  📊 [Tick {tick:>4}] {elapsed:>5.1f}ms | "
            f"Health: {mean_h:.3f} | "
            f"Surprised: {surprised_count:,}/{total:,} | "
            f"LLM calls so far: {llm_calls}"
        )

# ── Summary ───────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("RESULTS")
print("=" * 50)
print(f"\n  Total ticks:      1,000")
print(f"  Rust-only ticks:  {1000 - llm_calls} (FREE)")
print(f"  LLM calls:        {llm_calls} (PAID)")
print(f"  Cost reduction:   {(1 - llm_calls/1000)*100:.1f}% vs calling LLM every tick")
print(f"\n--- What just happened? ---")
print(f"{AGENT_COUNT:,} Rust agents ran anomaly detection for 1000 ticks.")
print(f"The LLM was only called {llm_calls} times — when the swarm detected")
print(f"a genuine anomaly cascade. This is SELECTIVE REASONING.")
print(f"In LangChain, you'd pay for 1000 LLM calls. Here you paid for {llm_calls}.")
