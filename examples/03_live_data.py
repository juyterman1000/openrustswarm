"""
Ebbiforge — Example 03: Live Data Injection
================================================

Connect ANY external data source to the swarm using the generic
DataSource/Signal interface. This example uses HTTPPoller to
fetch data from a REST API and inject it as swarm signals.

The framework is domain-agnostic — swap the URL and transform
function for YOUR data source (crypto, weather, IoT, stocks, etc).

Run: python examples/03_live_data.py
  or: ebbiforge example live
"""

try:
    import ebbiforge_core as cogops
except ImportError:
    print("❌ Rust core required. Build with: maturin develop --release")
    exit(1)

import time
from ebbiforge.connectors import HTTPPoller, Signal

# ── Define your data transform ────────────────────────────────────
# This is where YOU define how external data maps to swarm signals.
# The example uses CoinGecko, but this works with ANY REST API.

def parse_crypto(data: dict) -> list:
    """Transform API response into swarm signals."""
    signals = []
    for coin_id in ["bitcoin", "ethereum", "solana"]:
        coin = data.get(coin_id, {})
        change = coin.get("usd_24h_change", 0)
        signals.append(Signal(
            source=coin_id,
            value=change / 10.0,  # Normalize: ±10% → ±1.0
            weight=0.5,
            metadata={"price_usd": coin.get("usd", 0), "change_pct": change},
        ))
    return signals

# ── Create the HTTPPoller connector ───────────────────────────────
feed = HTTPPoller(
    url="https://api.coingecko.com/api/v3/simple/price"
        "?ids=bitcoin,ethereum,solana"
        "&vs_currencies=usd&include_24hr_change=true",
    transform=parse_crypto,
    cache_ttl=30,  # Don't hammer the API
)

# ── Initialize swarm ──────────────────────────────────────────────
print("📡 Ebbiforge — Live Data Injection Demo")
print("=" * 50)
print("Connecting external data → swarm signals...\n")

swarm = cogops.TensorSwarm(agent_count=10_000)
swarm.register_locations(
    villages=[(200, 300), (600, 700)],
    towns=[(400, 400)],
    cities=[(500, 500)],
    ambush_zones=[],
)

# ── Run with live data injection ──────────────────────────────────
for tick in range(300):
    swarm.tick()

    # Inject live signals every 50 ticks
    if tick % 50 == 0:
        signals = feed.fetch()
        for i, signal in enumerate(signals):
            # Inject each signal at a different spatial location
            x = 200 + i * 200
            y = 400
            swarm.apply_environmental_shock(
                location=(x, y),
                radius=5,
                intensity=abs(signal.intensity),
            )

        # Report
        surprised = sum(1 for s in swarm.surprise_scores if s > 0.3)
        total = len(swarm.health)

        print(f"  Tick {tick:>3} | ", end="")
        for s in signals:
            price = s.metadata.get("price_usd", 0)
            change = s.metadata.get("change_pct", 0)
            print(f"{s.source[:3].upper()} ${price:>8,.0f} ({change:+.1f}%) | ", end="")
        print(f"Surprised: {surprised}/{total}")

print("\n✅ Demo complete.")
print("\n--- What just happened? ---")
print("External REST API data was transformed into swarm signals via HTTPPoller.")
print("The framework is domain-agnostic — swap the URL + transform for YOUR data:")
print("  • Stock prices   → HTTPPoller + your broker API")
print("  • IoT sensors    → WebhookReceiver + your gateway")
print("  • News feeds     → RSSFeed + any RSS URL")
print("  • Custom events  → DataSource subclass")
