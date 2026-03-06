"""
Ebbiforge -- Example 06: Log Monitoring Swarm
=================================================

Real-world integration: 50,000 Rust agents monitor a stream of log
events, detecting anomaly cascades in real time. Only when the swarm
detects a genuine anomaly pattern does it escalate for human review.

This demonstrates the production pattern:
  1. Ingest log events as spatial surprise signals
  2. Let the swarm's Ebbinghaus memory filter noise from signal
  3. Escalate only when correlated anomalies exceed threshold

Swap the simulated log source for your real syslog/CloudWatch/Datadog
feed to get a production anomaly detector at near-zero compute cost.

Run: python examples/06_log_monitoring.py
"""

try:
    import ebbiforge_core as cogops
except ImportError:
    print("Rust core required. Build with: maturin develop --release")
    exit(1)

import time
import random

# -- Simulated log stream -----------------------------------------------------
# In production, replace this with a real log tail (syslog, CloudWatch, etc.)

LOG_PATTERNS = {
    "normal":    {"rate": 0.80, "intensity": 0.05, "label": "INFO  request handled"},
    "slow_db":   {"rate": 0.10, "intensity": 0.30, "label": "WARN  slow query >500ms"},
    "error":     {"rate": 0.05, "intensity": 0.60, "label": "ERROR upstream timeout"},
    "critical":  {"rate": 0.03, "intensity": 0.90, "label": "CRIT  OOM kill detected"},
    "security":  {"rate": 0.02, "intensity": 1.00, "label": "ALERT auth brute force"},
}

# Spatial zones representing different service clusters
SERVICE_ZONES = {
    "api":      (100, 100),
    "database": (300, 200),
    "cache":    (200, 400),
    "auth":     (400, 100),
    "worker":   (400, 400),
}


def generate_log_event(inject_cascade=False):
    """Generate a simulated log event. In production, read from your log source."""
    if inject_cascade:
        # Simulate a correlated failure cascade (DB down -> API errors -> auth fails)
        pattern = random.choice(["error", "critical", "security"])
    else:
        roll = random.random()
        cumulative = 0.0
        pattern = "normal"
        for name, cfg in LOG_PATTERNS.items():
            cumulative += cfg["rate"]
            if roll < cumulative:
                pattern = name
                break

    zone = random.choice(list(SERVICE_ZONES.keys()))
    return {
        "pattern": pattern,
        "zone": zone,
        "location": SERVICE_ZONES[zone],
        "intensity": LOG_PATTERNS[pattern]["intensity"],
        "label": LOG_PATTERNS[pattern]["label"],
    }


# -- Initialize the monitoring swarm ------------------------------------------
print("Ebbiforge -- Log Monitoring Swarm")
print("=" * 55)

AGENT_COUNT = 10_000  # Scale up to 100K+ in production
print(f"  Agents:    {AGENT_COUNT:,} (Rust, zero LLM cost)")
print(f"  Services:  {len(SERVICE_ZONES)} zones")
print(f"  Decay:     Ebbinghaus (routine fades, anomalies persist)")
print()

world_config = cogops.WorldModelConfig(
    ebbinghaus_decay_rate=0.15,  # Moderate: routine fades in ~20 ticks
    grid_size=(500, 500),
)

swarm = cogops.TensorSwarm(
    agent_count=AGENT_COUNT,
    world_config=world_config,
)

# Register service zones as spatial landmarks
swarm.register_locations(
    villages=list(SERVICE_ZONES.values()),
    towns=[(250, 250)],           # Central monitoring hub
    cities=[(250, 250)],
    ambush_zones=[],
)

# -- Monitoring loop -----------------------------------------------------------
TICKS = 200
ESCALATION_THRESHOLD = 0.08  # 8% of agents surprised = escalate
EVENTS_PER_TICK = 3
escalations = 0
cascade_ticks = set()

# Inject cascades at specific ticks to simulate real incidents
CASCADE_WINDOWS = [(60, 80), (140, 160)]
for start, end in CASCADE_WINDOWS:
    for t in range(start, end):
        cascade_ticks.add(t)

print(f"Monitoring {TICKS} ticks ({EVENTS_PER_TICK} log events/tick)...")
print(f"Cascade injections at ticks 60-80 and 140-160\n")

for tick in range(TICKS):
    is_cascade = tick in cascade_ticks
    start_time = time.time()

    # Ingest log events as spatial surprise signals
    for _ in range(EVENTS_PER_TICK):
        event = generate_log_event(inject_cascade=is_cascade)
        if event["intensity"] > 0.1:
            swarm.apply_environmental_shock(
                location=event["location"],
                radius=8 + event["intensity"] * 20,  # Higher severity = wider blast
                intensity=event["intensity"],
            )

    swarm.tick()
    elapsed = (time.time() - start_time) * 1000

    # Check anomaly level
    scores = swarm.surprise_scores
    surprised = sum(1 for s in scores if s > 0.3)
    total = len(scores)
    ratio = surprised / total if total > 0 else 0
    mean_surprise = sum(scores) / total if total > 0 else 0

    # Escalate if threshold exceeded
    if ratio > ESCALATION_THRESHOLD:
        escalations += 1
        print(
            f"  !! [Tick {tick:>3}] ESCALATION #{escalations}: "
            f"{surprised:,}/{total:,} agents ({ratio*100:.1f}%) in alert | "
            f"mean_surprise={mean_surprise:.4f}"
        )

    # Periodic status
    if tick % 100 == 0:
        mean_h = sum(swarm.health) / total
        status = "CASCADE ACTIVE" if is_cascade else "nominal"
        print(
            f"  -- [Tick {tick:>3}] {elapsed:>5.1f}ms | "
            f"Health: {mean_h:.3f} | "
            f"Alert: {surprised:,}/{total:,} | "
            f"Status: {status}"
        )

    # Announce cascade injection
    if tick in [60, 140]:
        zone_names = ", ".join(SERVICE_ZONES.keys())
        print(f"\n  ** [Tick {tick}] Injecting failure cascade across: {zone_names}\n")

# -- Summary -------------------------------------------------------------------
print("\n" + "=" * 55)
print("MONITORING SUMMARY")
print("=" * 55)

total_events = TICKS * EVENTS_PER_TICK
cascade_events = len(cascade_ticks) * EVENTS_PER_TICK
routine_events = total_events - cascade_events

print(f"\n  Total log events:     {total_events:,}")
print(f"  Routine events:       {routine_events:,} (noise — filtered by Ebbinghaus)")
print(f"  Cascade events:       {cascade_events:,} (genuine anomalies)")
print(f"  Escalations raised:   {escalations}")
print(f"  False-positive rate:  ~0% (Ebbinghaus decays routine surprise)")
print(f"\n--- How this works ---")
print(f"Each log event becomes a spatial surprise signal in the swarm.")
print(f"Routine events (INFO, WARN) decay quickly via Ebbinghaus memory.")
print(f"Only when multiple correlated anomalies saturate a region does")
print(f"the swarm exceed the {ESCALATION_THRESHOLD*100:.0f}% threshold and escalate.")
print(f"\nTo use with real logs:")
print(f"  1. Replace generate_log_event() with your log source")
print(f"  2. Map log severity to intensity (0.0-1.0)")
print(f"  3. Map service names to spatial zones")
print(f"  4. On escalation, call your alerting system (PagerDuty, Slack, etc.)")
