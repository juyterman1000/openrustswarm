'use client';

import { useCallback, useRef } from 'react';
import { RingBuffer } from '../lib/ring-buffer';
import type { Metrics } from '../lib/types';

const HISTORY_SIZE = 600; // 10 min at 1Hz sampling
const SAMPLE_INTERVAL_MS = 1000;

export interface TimeSeriesBuffers {
  r0Eff: RingBuffer;
  meanSurprise: RingBuffer;
  surprisedPct: RingBuffer;
  meanHealth: RingBuffer;
  meanGeneration: RingBuffer;
  geneDiversity: RingBuffer;
}

export function useTimeSeriesHistory() {
  const buffersRef = useRef<TimeSeriesBuffers>({
    r0Eff: new RingBuffer(HISTORY_SIZE),
    meanSurprise: new RingBuffer(HISTORY_SIZE),
    surprisedPct: new RingBuffer(HISTORY_SIZE),
    meanHealth: new RingBuffer(HISTORY_SIZE),
    meanGeneration: new RingBuffer(HISTORY_SIZE),
    geneDiversity: new RingBuffer(HISTORY_SIZE),
  });
  const lastSampleRef = useRef(0);

  const record = useCallback((m: Metrics) => {
    const now = performance.now();
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return;
    lastSampleRef.current = now;

    const b = buffersRef.current;
    b.r0Eff.push(m.r0Eff);
    b.meanSurprise.push(m.meanSurprise);
    b.surprisedPct.push(m.nAgents > 0 ? m.surprisedCount / m.nAgents : 0);
    b.meanHealth.push(m.meanHealth);
    b.meanGeneration.push(m.meanGeneration);
    b.geneDiversity.push(m.geneDiversity);
  }, []);

  const clear = useCallback(() => {
    const b = buffersRef.current;
    b.r0Eff.clear();
    b.meanSurprise.clear();
    b.surprisedPct.clear();
    b.meanHealth.clear();
    b.meanGeneration.clear();
    b.geneDiversity.clear();
    lastSampleRef.current = 0;
  }, []);

  return { buffers: buffersRef.current, record, clear };
}
