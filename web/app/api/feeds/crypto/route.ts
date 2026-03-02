import { NextResponse } from "next/server";

// CoinGecko free API — no auth required
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";

// Cache to avoid hammering the API (15s TTL — matches client poll interval)
let cache: { data: CryptoFeed | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 15_000;

interface CoinData {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

export interface CryptoFeed {
  bitcoin: CoinData;
  ethereum: CoinData;
  solana: CoinData;
  fetchedAt: number;
}

export async function GET() {
  const now = Date.now();

  // Return cached data if fresh
  if (cache.data && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko returned ${res.status}` },
        { status: 502 }
      );
    }

    const raw = await res.json();

    const data: CryptoFeed = {
      bitcoin: raw.bitcoin || { usd: 0, usd_24h_change: 0, last_updated_at: 0 },
      ethereum: raw.ethereum || { usd: 0, usd_24h_change: 0, last_updated_at: 0 },
      solana: raw.solana || { usd: 0, usd_24h_change: 0, last_updated_at: 0 },
      fetchedAt: now,
    };

    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
