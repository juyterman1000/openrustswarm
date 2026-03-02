---
name: cogops
description: CogOps Swarm Intelligence — query live swarm state, trigger narrations, inject signals
---

# CogOps Swarm Intelligence Skill

You have access to a **living swarm intelligence organism** called CogOps. It runs 50,000+ agents in Rust/WASM with real SIRS epidemiology, Darwinian evolution (6 heritable genes), spatial hash grids, 6-channel pheromone fields, and Ebbinghaus memory decay. The swarm ingests live crypto prices (BTC, ETH, SOL from CoinGecko) and GitHub developer activity as sensory input.

## Available Tools

### Query Swarm State
Fetch the current state of the swarm organism including all metrics, alerts, and real-world data feeds.

```bash
curl -s http://localhost:3000/api/swarm | python3 -m json.tool
```

Returns: agent count, mean surprise, mean health, R₀ effective/base, gene diversity, generation, alerts with LLM analysis.

### Query Real-World Data Feeds
Get the live crypto and GitHub data feeding the swarm.

```bash
# Crypto prices (BTC, ETH, SOL with 24h change)
curl -s http://localhost:3000/api/feeds/crypto | python3 -m json.tool

# GitHub activity (event counts, activity score)
curl -s http://localhost:3000/api/feeds/github | python3 -m json.tool
```

### Request Narration
Ask Gemini to explain what the swarm is currently sensing. Provide the event type and current metrics.

```bash
curl -s -X POST http://localhost:3000/api/swarm/narrate \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "surprise_cascade",
    "metrics": {
      "tick": 1000,
      "nAgents": 50000,
      "meanSurprise": 0.18,
      "meanHealth": 0.72,
      "r0Eff": 1.35,
      "r0Base": 0.8,
      "geneDiversity": 0.042,
      "meanGeneration": 5.2,
      "surprisedCount": 8500,
      "peakSurprise": 0.95
    },
    "prevMetrics": {
      "meanSurprise": 0.05,
      "r0Eff": 0.7
    },
    "realWorld": {
      "crypto": {
        "bitcoin": {"usd": 65000, "usd_24h_change": -3.5},
        "ethereum": {"usd": 1900, "usd_24h_change": -5.1},
        "solana": {"usd": 80, "usd_24h_change": -6.2}
      }
    }
  }' | python3 -m json.tool
```

Returns: A Gemini-generated plain-English explanation of what the swarm is experiencing, connected to real-world data.

Event types: `surprise_cascade`, `r0_critical`, `gene_collapse`, `health_crisis`, `mass_death`

### Inject Signal Into Swarm
Inject an environmental shock into the swarm. Use this when the user wants to test the swarm's reaction to a scenario.

```bash
curl -s -X POST http://localhost:3000/api/openclaw/inject \
  -H "Content-Type: application/json" \
  -d '{
    "x": 500,
    "y": 500,
    "radius": 100,
    "intensity": 0.8,
    "reason": "User requested Bitcoin crash simulation"
  }' | python3 -m json.tool
```

Parameters:
- `x`, `y`: position in the swarm world (0-1000)
- `radius`: shock radius (10-200)
- `intensity`: surprise intensity (0.0-1.0)
- `reason`: human-readable reason for the injection

## How to Use This Skill

When the user asks about markets, anomalies, or swarm behavior:

1. **First** query `/api/feeds/crypto` to get current prices
2. **Then** query `/api/swarm` to get the swarm's biological response
3. **If interesting**, request a narration via `/api/swarm/narrate` to get Gemini's analysis
4. **Synthesize** the real-world data + swarm response + narration into a clear answer

When the user says things like "what does the swarm think about Bitcoin?" or "is the market doing anything weird?", use this workflow.

## Example Interactions

**User**: "What is the swarm sensing right now?"
→ Query state + crypto, narrate if R₀ > 1.0 or surprise elevated

**User**: "Shock the swarm — simulate a flash crash"
→ Inject signal with high intensity, wait 2s, query state again, narrate the response

**User**: "How are markers doing?"
→ Query crypto feed, explain prices, query swarm state to see if the organism is reacting
