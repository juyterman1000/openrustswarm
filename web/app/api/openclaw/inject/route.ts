import { NextResponse } from "next/server";

/**
 * Signal injection API — allows OpenClaw (or any external agent) to
 * inject environmental shocks into the WASM swarm.
 * 
 * This is Layer 3's "Hands" in reverse: the assistant reaches INTO
 * the organism to probe it, not just read its state.
 * 
 * Note: The actual WASM injection happens client-side. This endpoint
 * stores pending injections that the client polls for.
 */

// Pending injections queue (in-memory, consumed by client polling)
const pendingInjections: Array<{
  x: number;
  y: number;
  radius: number;
  intensity: number;
  reason: string;
  timestamp: number;
}> = [];

const MAX_PENDING = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { x = 500, y = 500, radius = 80, intensity = 0.5, reason = "External injection" } = body;

    // Validate
    const injection = {
      x: Math.max(0, Math.min(1000, Number(x))),
      y: Math.max(0, Math.min(1000, Number(y))),
      radius: Math.max(10, Math.min(200, Number(radius))),
      intensity: Math.max(0, Math.min(1, Number(intensity))),
      reason: String(reason).slice(0, 200),
      timestamp: Date.now(),
    };

    pendingInjections.push(injection);
    if (pendingInjections.length > MAX_PENDING) {
      pendingInjections.shift(); // Drop oldest
    }

    return NextResponse.json({
      status: "queued",
      injection,
      pending: pendingInjections.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// Client polls this to consume pending injections
export async function GET() {
  const batch = pendingInjections.splice(0); // Drain queue
  return NextResponse.json({ injections: batch });
}
