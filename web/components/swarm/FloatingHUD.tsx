'use client';

import { R0Indicator } from './R0Indicator';
import type { Metrics } from '../../lib/types';

/** Minimal always-visible overlay — top-left corner. */
export function FloatingHUD({ metrics }: { metrics: Metrics }) {
  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-none flex flex-col gap-3">
      <div className="pointer-events-auto">
        <R0Indicator r0Eff={metrics.r0Eff} r0Base={metrics.r0Base} />
      </div>

      <div className="flex items-center gap-3 text-[0.65rem] font-mono text-slate-400">
        <span>{metrics.nAgents.toLocaleString()} agents</span>
        <span className="text-slate-600">|</span>
        <span>tick {metrics.tick.toLocaleString()}</span>
      </div>

      <div className="text-[0.55rem] font-mono text-slate-600 opacity-60">
        {metrics.fps} FPS · {metrics.tickMs.toFixed(1)}ms/tick
      </div>
    </div>
  );
}
