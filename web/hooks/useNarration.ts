'use client';

import { useCallback, useRef, useState } from 'react';
import type { Metrics } from '../lib/types';

// ─── Types ───────────────────────────────────────────────────────────

export type NarrationEventType =
  | 'surprise_cascade'
  | 'r0_critical'
  | 'gene_collapse'
  | 'health_crisis'
  | 'mass_death';

export interface Narration {
  id: number;
  eventType: NarrationEventType;
  explanation: string;
  metrics: Partial<Metrics>;
  timestamp: number;
}

// ─── Thresholds ──────────────────────────────────────────────────────

const THRESHOLDS = {
  surpriseCascade: { from: 0.10, to: 0.15 },
  r0Critical: 1.2,
  geneCollapse: 0.01,
  healthCrisis: 0.5,
  massDeathPct: 0.05,
} as const;

const MIN_INTERVAL_MS = 15_000; // Max 1 Gemini call per 15 seconds
const MAX_HISTORY = 5;

// ─── Event Labels ────────────────────────────────────────────────────

const EVENT_LABELS: Record<NarrationEventType, { label: string; color: string }> = {
  surprise_cascade: { label: 'Surprise Cascade', color: '#f87171' },
  r0_critical:      { label: 'R₀ Critical', color: '#fb923c' },
  gene_collapse:    { label: 'Gene Collapse', color: '#a78bfa' },
  health_crisis:    { label: 'Health Crisis', color: '#fbbf24' },
  mass_death:       { label: 'Mass Death', color: '#ef4444' },
};

export { EVENT_LABELS };

// ─── Hook ────────────────────────────────────────────────────────────

export function useNarration() {
  const [narrations, setNarrations] = useState<Narration[]>([]);
  const [loading, setLoading] = useState(false);

  const prevMetricsRef = useRef<Metrics | null>(null);
  const lastCallRef = useRef(0);
  const idRef = useRef(0);
  const realWorldRef = useRef<any>(null);

  // Allow external code to update real-world data context
  const setRealWorldData = useCallback((data: any) => {
    realWorldRef.current = data;
  }, []);

  const detectEvent = useCallback((prev: Metrics, curr: Metrics): NarrationEventType | null => {
    // 1. Surprise Cascade — spike from low to high
    if (prev.meanSurprise < THRESHOLDS.surpriseCascade.from &&
        curr.meanSurprise > THRESHOLDS.surpriseCascade.to) {
      return 'surprise_cascade';
    }

    // 2. R₀ Critical — exponential spread threshold
    if (prev.r0Eff < THRESHOLDS.r0Critical && curr.r0Eff >= THRESHOLDS.r0Critical) {
      return 'r0_critical';
    }

    // 3. Gene Collapse — population converging (diversity dropping)
    if (prev.geneDiversity > THRESHOLDS.geneCollapse * 2 &&
        curr.geneDiversity <= THRESHOLDS.geneCollapse &&
        curr.evolutionEnabled) {
      return 'gene_collapse';
    }

    // 4. Health Crisis — mean health drops dangerously
    if (prev.meanHealth > THRESHOLDS.healthCrisis + 0.1 &&
        curr.meanHealth <= THRESHOLDS.healthCrisis) {
      return 'health_crisis';
    }

    // 5. Mass Death — sudden agent loss
    if (prev.nAgents > 0) {
      const deathRatio = (prev.nAgents - curr.nAgents) / prev.nAgents;
      if (deathRatio > THRESHOLDS.massDeathPct) {
        return 'mass_death';
      }
    }

    return null;
  }, []);

  const checkAndNarrate = useCallback(async (metrics: Metrics) => {
    const prev = prevMetricsRef.current;
    prevMetricsRef.current = { ...metrics };

    if (!prev) return; // First tick — no comparison

    const event = detectEvent(prev, metrics);
    if (!event) return;

    // Rate limit
    const now = Date.now();
    if (now - lastCallRef.current < MIN_INTERVAL_MS) return;
    lastCallRef.current = now;

    setLoading(true);

    try {
      const res = await fetch('/api/swarm/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: event,
          metrics: {
            tick: metrics.tick,
            nAgents: metrics.nAgents,
            meanSurprise: metrics.meanSurprise,
            meanHealth: metrics.meanHealth,
            r0Eff: metrics.r0Eff,
            r0Base: metrics.r0Base,
            geneDiversity: metrics.geneDiversity,
            meanGeneration: metrics.meanGeneration,
            surprisedCount: metrics.surprisedCount,
            peakSurprise: metrics.peakSurprise,
          },
          prevMetrics: {
            meanSurprise: prev.meanSurprise,
            meanHealth: prev.meanHealth,
            r0Eff: prev.r0Eff,
            geneDiversity: prev.geneDiversity,
          },
          realWorld: realWorldRef.current,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          const narration: Narration = {
            id: ++idRef.current,
            eventType: event,
            explanation: data.explanation,
            metrics,
            timestamp: Date.now(),
          };

          setNarrations(prev => {
            const next = [narration, ...prev];
            return next.slice(0, MAX_HISTORY);
          });
        }
      }
    } catch {
      // Silently fail — narration is non-critical
    } finally {
      setLoading(false);
    }
  }, [detectEvent]);

  return { narrations, loading, checkAndNarrate, setRealWorldData };
}
