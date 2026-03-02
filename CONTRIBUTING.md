# Contributing to OpenRustSwarm

We want your contributions. Here's how to get started.

## Development Setup

### Rust Engine
```bash
git clone https://github.com/juyterman1000/openrustswarm.git
cd openrustswarm/openrustswarm-core
cargo build --release
cargo test
```

### Web Dashboard
```bash
cd web
npm install
cp .env.local.example .env.local  # Add your GEMINI_API_KEY
npm run dev
# → http://localhost:3000
```

### Python Server
```bash
cd server
pip install -r requirements.txt
python main.py
```

## Good First Issues

These are easy entry points — each is a self-contained change:

| Task | File(s) | Difficulty |
|------|---------|------------|
| Add a new data feed (e.g. earthquake, stock index) | `web/app/api/feeds/` | 🟢 Easy |
| New swarm color mode | `web/lib/color-maps.ts` | 🟢 Easy |
| New narrator personality | `web/app/api/swarm/narrate/route.ts` | 🟢 Easy |
| Mobile-responsive dashboard | `web/app/page.tsx`, `web/app/globals.css` | 🟡 Medium |
| WebAudio sound design for R₀ tension | `web/hooks/`, new hook | 🟡 Medium |
| Add a 7th pheromone channel | `openrustswarm-core/src/swarm/` | 🔴 Hard |
| New heritable gene | `openrustswarm-core/src/evolution/` | 🔴 Hard |

## Technical Standards

- **Rust**: `cargo fmt` and `cargo test` must pass. No `unsafe` without justification.
- **Web**: `npx next build` must pass with zero errors.
- **Performance**: Core engine changes must not regress throughput. Benchmark before/after.

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Verify builds (`cargo test` for Rust, `npx next build` for web)
5. Open a PR with a clear description

## Code of Conduct

Be respectful. Be constructive. We're building something alive.
