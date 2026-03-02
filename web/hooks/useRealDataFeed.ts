'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface CoinData {
  usd: number;
  usd_24h_change: number;
}

export interface CryptoSnapshot {
  bitcoin: CoinData;
  ethereum: CoinData;
  solana: CoinData;
  fetchedAt: number;
}

export interface GitHubSnapshot {
  summary: {
    totalEvents: number;
    pushEvents: number;
    prEvents: number;
    issueEvents: number;
    watchEvents: number;
    forkEvents: number;
    uniqueRepos: number;
    uniqueActors: number;
  };
  activityScore: number;
  fetchedAt: number;
}

export interface RealWorldState {
  crypto: CryptoSnapshot | null;
  github: GitHubSnapshot | null;
  lastUpdate: number;
}

/**
 * Convert real-world data into surprise signals for the WASM swarm.
 * 
 * KEY DESIGN: We track INTER-POLL price deltas, not static 24h change.
 * All positions are computed proportionally from the WASM engine's worldSize.
 */

// ─── Configuration ───────────────────────────────────────────────────
// These define HOW the organism reacts, not WHERE or WHAT.
// All spatial values are expressed as fractions of worldSize.

const SIGNAL_CONFIG = {
  // Noise floor: deltas below this (in %) are ignored
  noiseThreshold: 0.03,
  // Scale factor: maps % delta to 0-1 intensity
  // 0.5% inter-poll delta = max intensity 1.0
  intensityScale: 2.0,
  // Asset cluster positions (fraction of worldSize)
  clusters: {
    btc:    { x: 0.25, y: 0.40 },
    btcAlt: { x: 0.20, y: 0.55 },
    btcAlt2:{ x: 0.30, y: 0.30 },
    eth:    { x: 0.50, y: 0.50 },
    ethAlt: { x: 0.55, y: 0.35 },
    sol:    { x: 0.75, y: 0.50 },
    solAlt: { x: 0.80, y: 0.40 },
    github: { x: 0.50, y: 0.30 },
  },
  // Shock radius as fraction of worldSize
  baseRadius: 0.05,    // minimum shock radius
  maxRadius: 0.16,     // maximum shock radius
  // Thresholds for secondary / tertiary shockwaves
  secondaryThreshold: 0.4,
  tertiaryThreshold: 0.7,
  // Initial signal: minimum 24h change % to inject on first poll
  initialMinChange: 1.0,
  // GitHub: minimum activity score to inject
  githubMinActivity: 0.5,
} as const;

function computeSignals(
  crypto: CryptoSnapshot,
  prevCrypto: CryptoSnapshot | null,
  github: GitHubSnapshot | null,
  worldSize: number,
): Array<{ x: number; y: number; radius: number; intensity: number }> {

  const shocks: Array<{ x: number; y: number; radius: number; intensity: number }> = [];
  const C = SIGNAL_CONFIG;
  const pos = (frac: { x: number; y: number }) => ({
    x: frac.x * worldSize,
    y: frac.y * worldSize,
  });
  const radius = (intensity: number) =>
    (C.baseRadius + intensity * (C.maxRadius - C.baseRadius)) * worldSize;

  if (!prevCrypto) {
    // First poll — use 24h change as initial signal
    const changes = [
      { change: Math.abs(crypto.bitcoin.usd_24h_change || 0), cluster: C.clusters.btc },
      { change: Math.abs(crypto.ethereum.usd_24h_change || 0), cluster: C.clusters.eth },
      { change: Math.abs(crypto.solana.usd_24h_change || 0), cluster: C.clusters.sol },
    ];
    for (const { change, cluster } of changes) {
      if (change > C.initialMinChange) {
        const intensity = Math.min(change / 8, 0.8);
        const p = pos(cluster);
        shocks.push({ ...p, radius: radius(intensity), intensity });
      }
    }
    return shocks;
  }

  // INTER-POLL DELTAS — this is what makes organisms react in real-time
  const deltas = [
    {
      delta: prevCrypto.bitcoin.usd > 0
        ? ((crypto.bitcoin.usd - prevCrypto.bitcoin.usd) / prevCrypto.bitcoin.usd) * 100 : 0,
      primary: C.clusters.btc, secondary: C.clusters.btcAlt, tertiary: C.clusters.btcAlt2,
    },
    {
      delta: prevCrypto.ethereum.usd > 0
        ? ((crypto.ethereum.usd - prevCrypto.ethereum.usd) / prevCrypto.ethereum.usd) * 100 : 0,
      primary: C.clusters.eth, secondary: C.clusters.ethAlt, tertiary: null,
    },
    {
      delta: prevCrypto.solana.usd > 0
        ? ((crypto.solana.usd - prevCrypto.solana.usd) / prevCrypto.solana.usd) * 100 : 0,
      primary: C.clusters.sol, secondary: C.clusters.solAlt, tertiary: null,
    },
  ];

  for (const { delta, primary, secondary, tertiary } of deltas) {
    const absDelta = Math.abs(delta);
    if (absDelta < C.noiseThreshold) continue;

    const intensity = Math.min(absDelta * C.intensityScale, 1.0);
    const p = pos(primary);
    shocks.push({ ...p, radius: radius(intensity), intensity: intensity * 0.9 });

    if (intensity > C.secondaryThreshold) {
      const s = pos(secondary);
      shocks.push({ ...s, radius: radius(intensity) * 0.7, intensity: intensity * 0.6 });
    }
    if (intensity > C.tertiaryThreshold && tertiary) {
      const t = pos(tertiary);
      shocks.push({ ...t, radius: radius(intensity) * 0.5, intensity: intensity * 0.5 });
    }
  }

  // GitHub activity
  if (github && github.activityScore > C.githubMinActivity) {
    const p = pos(C.clusters.github);
    shocks.push({ ...p, radius: radius(github.activityScore * 0.4), intensity: github.activityScore * 0.4 });
  }

  return shocks;
}

// ─── Hook ────────────────────────────────────────────────────────────

const POLL_INTERVAL = 15_000; // 15 seconds

export function useRealDataFeed(
  injectShock?: (x: number, y: number, radius: number, intensity: number) => void,
  worldSize: number = 1000,
) {
  const [state, setState] = useState<RealWorldState>({
    crypto: null,
    github: null,
    lastUpdate: 0,
  });
  const prevCryptoRef = useRef<CryptoSnapshot | null>(null);

  const fetchFeeds = useCallback(async () => {
    try {
      const [cryptoRes, githubRes] = await Promise.allSettled([
        fetch('/api/feeds/crypto').then(r => r.ok ? r.json() : null),
        fetch('/api/feeds/github').then(r => r.ok ? r.json() : null),
      ]);

      const crypto = cryptoRes.status === 'fulfilled' ? cryptoRes.value : null;
      const github = githubRes.status === 'fulfilled' ? githubRes.value : null;

      setState({
        crypto,
        github,
        lastUpdate: Date.now(),
      });

      // Compute and inject signals from INTER-POLL DELTAS
      if (crypto && injectShock) {
        const shocks = computeSignals(crypto, prevCryptoRef.current, github, worldSize);

        // Stagger shocks for visible cascading ripple
        shocks.forEach((shock, i) => {
          setTimeout(() => {
            injectShock(shock.x, shock.y, shock.radius, shock.intensity);
          }, i * 150);
        });

        prevCryptoRef.current = crypto;
      }
    } catch {
      // Silent fail — data feeds are best-effort
    }
  }, [injectShock, worldSize]);

  // Poll on interval
  useEffect(() => {
    fetchFeeds(); // Initial fetch
    const interval = setInterval(fetchFeeds, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFeeds]);

  return state;
}
