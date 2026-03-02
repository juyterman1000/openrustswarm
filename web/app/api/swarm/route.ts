import { NextResponse } from "next/server";

const SERVER_URL = process.env.COGOPS_SERVER_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${SERVER_URL}/api/swarm/state`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server unreachable" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${SERVER_URL}/api/swarm/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server unreachable" }, { status: 502 });
  }
}
