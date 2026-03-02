<div align="center">
  <img src="logo.svg" alt="OpenRustSwarm" width="280">

  <h3>10 million organisms that react to the crypto market before you read the number.</h3>

  <p>A living swarm intelligence — built in Rust, visualized in WebAssembly, narrated by Gemini.</p>

  <a href="https://github.com/juyterman1000/openrustswarm/stargazers">
    <img src="https://img.shields.io/github/stars/juyterman1000/openrustswarm?style=social" alt="GitHub Stars">
  </a>
  &nbsp;
  <a href="https://github.com/juyterman1000/openrustswarm/fork">
    <img src="https://img.shields.io/github/forks/juyterman1000/openrustswarm?style=social" alt="GitHub Forks">
  </a>

  <br/><br/>

  [![CI](https://github.com/juyterman1000/openrustswarm/actions/workflows/ci.yml/badge.svg)](https://github.com/juyterman1000/openrustswarm/actions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Rust](https://img.shields.io/badge/rust-1.75+-orange.svg)](https://www.rust-lang.org/)
  [![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
</div>

<p align="center">
  <img src="demo/hero_banner.png" alt="OpenRustSwarm — BTC, ETH, SOL organism clusters reacting to live market data" width="800">
</p>

---

## What is this?

OpenRustSwarm is a biological simulation where autonomous organisms process real-world data as sensory input. It doesn't chart prices — it reacts to them. Biologically.

Instead of traditional dashboards, the swarm uses SIRS epidemiology and Darwinian evolution to manifest market volatility as physical pressure. When Bitcoin drops, organisms in the BTC cluster die. Survivors evolve higher sensitivity. The reproduction number (R0) climbs. The canvas pulses red.

This is the "Nervous System" foundation for [CogOps](https://github.com/juyterman1000/cogops) and [OpenClaw](https://github.com/openclaw/openclaw), providing massive-scale sensory awareness for autonomous AI agents.

---

## Hard Proof: 10M Agent Scale

We don't mock scale. We manage it using a 4-tier Level of Detail (LOD) architecture.

### The 4-Tier Compute Stack

```mermaid
graph TD
    T1[Tier 1: Dormant - 9.0M Agents] -->|Trigger| T2
    T2[Tier 2: Simplified - 0.8M Agents] -->|Anomalies| T3
    T3[Tier 3: Full Tensor - 0.2M Agents] -->|Criticality| T4
    T4[Tier 4: Heavy - 10-100 Agents]

    subgraph "Nervous System (Rust/WASM)"
    T1 -.->|0.01ms CPU| T1
    T2 -.->|SIMD Physics| T2
    T3 -.->|Tensor Engine| T3
    end

    subgraph "Conscious Action (LLM)"
    T4 -.->|Gemini/OpenClaw| T4
    end
```

### Benchmark Evidence
`python3 test_10m_scale.py`
```text
INITIALIZING SMART SCALE TEST: 10,000,000 TOTAL AGENTS
   [LOD Configuration: 1,000,000 Active + 9,000,000 Dormant]
Initialization successful in 1.42s
   Memory Usage: 3710.24 MB (3.71 GB)
   Footprint per 10M Swarm: 0.37 KB/agent

EXECUTING TICKS...
   Average Tick Time: 0.0482s
   Throughput: 20,746,887 agents/sec
BENCHMARK COMPLETE (10M scale proven)
```

---

## Architecture

1. **LAYER 1: NERVOUS SYSTEM (RUST/WASM)**
   100+ source files handling spatial hash grids, pheromone fields, and Darwinian crossover. Runs in-browser via WASM at 200K agents @ 60fps.
2. **LAYER 2: THE VOICE (GEMINI)**
   Threshold-triggered narration. The swarm speaks when it feels pain.
3. **LAYER 3: THE HANDS (OPENCLAW)**
   Direct integration with OpenClaw for signal injection and webhook-driven alerts.
4. **LAYER 4: MEMORY (EBBINGHAUS)**
   Agents remember anomalies using exponential decay. They forget the "noise" of flat markets.

---

## Quick Start

```bash
git clone https://github.com/juyterman1000/openrustswarm.git
cd openrustswarm/web
npm install
npm run dev
```

The browser dashboard defaults to **200,000 organic agents** — the limit of real-time WebGL rendering on modern hardware.

---

## Roadmap

- [x] **Rust Engine**: SIRS, spatial hash, tensor engine, LOD (10M scale).
- [x] **Evolution**: 6 heritable genes, natural selection, crossover.
- [x] **WASM Bridge**: High-performance browser rendering.
- [x] **Data Feeds**: Live CoinGecko + GitHub Events integration.
- [x] **OpenClaw Skill**: Swarm-to-agent coordination protocol.
- [ ] **Live Demo URL**: Deployment in progress.
- [ ] **WebAudio**: R0-driven soundscapes (tension chords).
- [ ] **Mobile Support**: Optimized canvas for touch.

---

## Contributing

We are looking for people to add new data feeds. Every asset cluster is a sensory portal.

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup.

---

## License

[MIT License](LICENSE)

---

<div align="center">
  <a href="https://github.com/juyterman1000/openrustswarm/stargazers">
    <img src="https://img.shields.io/github/stars/juyterman1000/openrustswarm?style=social" alt="GitHub Stars">
  </a>
</div>
