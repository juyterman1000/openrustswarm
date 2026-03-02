import { NextResponse } from 'next/server';

const COINS = 'bitcoin,ethereum,solana,dogecoin,cardano,polkadot,avalanche-2,chainlink,litecoin,uniswap';

export async function GET() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 25 }, // cache for 25s to stay within free tier
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
