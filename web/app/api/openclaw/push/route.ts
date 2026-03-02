import { NextResponse } from "next/server";

// OpenClaw Gateway webhook endpoint
const OPENCLAW_WEBHOOK = process.env.OPENCLAW_WEBHOOK_URL || "http://localhost:18789/webhook";
const OPENCLAW_ENABLED = process.env.OPENCLAW_ENABLED === "true";

/**
 * Push a swarm alert + narration to OpenClaw's webhook.
 * Called by the narration system when critical thresholds fire.
 * OpenClaw then routes the message to the user's preferred channels
 * (WhatsApp, Telegram, Slack, Discord, etc.)
 */
export async function POST(request: Request) {
  if (!OPENCLAW_ENABLED) {
    return NextResponse.json({ status: "disabled", message: "Set OPENCLAW_ENABLED=true to activate" });
  }

  try {
    const body = await request.json();
    const { eventType, explanation, metrics, realWorld } = body;

    // Format message for OpenClaw
    const cryptoLine = realWorld?.crypto
      ? `📊 BTC $${realWorld.crypto.bitcoin?.usd?.toLocaleString()} (${realWorld.crypto.bitcoin?.usd_24h_change?.toFixed(1)}%) | ETH $${realWorld.crypto.ethereum?.usd?.toLocaleString()} (${realWorld.crypto.ethereum?.usd_24h_change?.toFixed(1)}%) | SOL $${realWorld.crypto.solana?.usd?.toLocaleString()} (${realWorld.crypto.solana?.usd_24h_change?.toFixed(1)}%)`
      : "";

    const message = [
      `🧬 **CogOps Alert: ${eventType?.replace(/_/g, " ").toUpperCase()}**`,
      "",
      explanation || "No explanation available.",
      "",
      cryptoLine,
      `🔬 ${metrics?.nAgents?.toLocaleString() || "?"} agents | R₀=${metrics?.r0Eff?.toFixed(3) || "?"} | Surprise=${metrics?.meanSurprise?.toFixed(4) || "?"}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Push to OpenClaw webhook
    const res = await fetch(OPENCLAW_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "cogops_alert",
        message,
        metadata: {
          eventType,
          severity: "high",
          source: "cogops-swarm",
          timestamp: Date.now(),
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", detail: `OpenClaw returned ${res.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ status: "pushed", eventType });
  } catch (e) {
    // Don't fail hard — OpenClaw push is best-effort
    return NextResponse.json({ status: "error", detail: String(e) }, { status: 500 });
  }
}
