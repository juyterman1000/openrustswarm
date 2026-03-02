import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Server-side rate limit: 1 call per 10 seconds
let lastCallTime = 0;
const RATE_LIMIT_MS = 10_000;

// Event-specific context templates
const EVENT_CONTEXT: Record<string, string> = {
  surprise_cascade:
    "A surprise cascade is a rapid, epidemic-like spread of anomaly detection across the agent population. Like a flock of birds reacting to a predator — one agent's surprise triggers its neighbors.",
  r0_critical:
    "R₀ (basic reproduction number) crossing 1.0 means each surprised agent infects more than one neighbor. Above 1.2 signals exponential, uncontrolled spread — the swarm equivalent of a pandemic.",
  gene_collapse:
    "Gene diversity collapse means the population is converging on a single phenotype. Natural selection is eliminating variation. This can signal either optimal adaptation OR dangerous homogeneity.",
  health_crisis:
    "Mean health dropping below 0.5 means the majority of agents are under stress. Resource competition, environmental shocks, or cascading failures are depleting the population.",
  mass_death:
    "A sudden loss of >5% of agents in one tick indicates a catastrophic event — environmental shock, resource collapse, or cascade failure overwhelming the population's resilience.",
};

export async function POST(request: Request) {
  // Rate limit
  const now = Date.now();
  if (now - lastCallTime < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs: RATE_LIMIT_MS - (now - lastCallTime) },
      { status: 429 }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "No GEMINI_API_KEY configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { eventType, metrics, prevMetrics, realWorld } = body;

    const context = EVENT_CONTEXT[eventType] || "";

    // Build real-world data section
    let realWorldSection = "";
    if (realWorld?.crypto) {
      const c = realWorld.crypto;
      realWorldSection += `\nREAL-WORLD DATA FEEDING THE SWARM:
Crypto Markets (live from CoinGecko):
- Bitcoin:  $${c.bitcoin?.usd?.toLocaleString() || "N/A"} (${c.bitcoin?.usd_24h_change?.toFixed(2) || "0"}% 24h)
- Ethereum: $${c.ethereum?.usd?.toLocaleString() || "N/A"} (${c.ethereum?.usd_24h_change?.toFixed(2) || "0"}% 24h)
- Solana:   $${c.solana?.usd?.toLocaleString() || "N/A"} (${c.solana?.usd_24h_change?.toFixed(2) || "0"}% 24h)`;
    }
    if (realWorld?.github) {
      const g = realWorld.github;
      realWorldSection += `\nGitHub Activity (live from Events API):
- ${g.summary?.totalEvents || 0} events across ${g.summary?.uniqueRepos || 0} repos
- ${g.summary?.pushEvents || 0} pushes, ${g.summary?.prEvents || 0} PRs, ${g.summary?.watchEvents || 0} stars
- Activity Score: ${(g.activityScore * 100).toFixed(0)}%`;
    }

    const prompt = `You are the VOICE of a living swarm intelligence organism. It ingests real-world data (crypto prices, GitHub developer activity) as sensory input that feeds into a biological simulation running ${(metrics.nAgents || 0).toLocaleString()} agents in Rust/WASM.

ARCHITECTURE (what drives these numbers — 100+ Rust source files):
- SIRS Epidemiology: agents transition Susceptible→Infected→Recovered→Susceptible. R₀ is the real reproduction number computed from neighbor infections via spatial hash grid with Fibonacci hashing.
- Darwinian Evolution: 6 heritable genes per agent (transfer_rate, recovery_rate, infection_radius, broadcast_power, sensitivity, mutation_rate). Natural selection acts on fitness. Crossover and mutation create genetic variation each generation.
- Spatial Hash Grid: O(1) neighbor lookups. Agents interact only with spatial neighbors. Cohesion, separation, and surprise propagation are real physics, not random.
- 6-Channel Pheromone Field: danger, trail, food, novelty, alarm, reward channels deposited by agents and decayed each tick. Stigmergic communication layer.
- Ebbinghaus Memory Decay: surprise scores decay following the forgetting curve. Agents retain memory of anomalies proportional to their impact.
- Population Genetics: PopulationEngine tracks gene pool diversity (σ), selects fittest agents, applies crossover. Gene collapse = dangerous monoculture.
- Metacognition: CuriosityModule proposes novel challenges. MetaCognition generates insights. IntrospectionEngine monitors internal state.
- Safety: PredictiveSafetyShield scores trajectory risk. ComplianceEngine enforces rate limits, PII redaction, audit trails.

EVENT: ${eventType.replace(/_/g, " ").toUpperCase()}
${context}
${realWorldSection}

LIVE METRICS:
- Surprise: ${metrics.meanSurprise?.toFixed(6) || "N/A"} (peak: ${metrics.peakSurprise?.toFixed(4) || "N/A"}, ${metrics.surprisedCount || 0}/${metrics.nAgents || 0} agents surprised)
- Health: ${metrics.meanHealth?.toFixed(6) || "N/A"}
- R₀: ${metrics.r0Eff?.toFixed(3) || "N/A"} effective / ${metrics.r0Base?.toFixed(3) || "N/A"} base
- Evolution: gen ${metrics.meanGeneration?.toFixed(1) || "N/A"}, gene diversity σ=${metrics.geneDiversity?.toFixed(6) || "N/A"}
- Previous: surprise was ${prevMetrics?.meanSurprise?.toFixed(6) || "N/A"}, R₀ was ${prevMetrics?.r0Eff?.toFixed(3) || "N/A"}

Connect the real-world data to the swarm's biological response. Reference which Rust subsystem is reacting (SIRS, evolution, pheromones, spatial). DO NOT just report the numbers — describe what's happening to the ORGANISMS. Instead of "BTC dropped 2.3%", say "847 organisms near the BTC cluster just died. The survivors are evolving higher sensitivity." Instead of "R₀ is 1.35", say "Each infected organism is now spreading surprise to 1.35 neighbors — the cascade is accelerating." 2-3 sentences. Nature documentary narrator watching a living thing react. No markdown.`;

    lastCallTime = now;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini error: ${res.status}`, detail: errText }, { status: 502 });
    }

    const data = await res.json();
    const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({
      explanation,
      eventType,
      model: MODEL,
      tokensUsed: data?.usageMetadata?.totalTokenCount || 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
