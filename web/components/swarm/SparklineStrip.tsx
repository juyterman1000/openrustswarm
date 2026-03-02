'use client';

import { useRef, useEffect, useCallback } from 'react';
import { drawSparkline } from '../../lib/sparkline-renderer';
import type { TimeSeriesBuffers } from '../../hooks/useTimeSeriesHistory';

interface SparklineDef {
  key: keyof TimeSeriesBuffers;
  label: string;
  color: string;
  referenceLine?: number;
  referenceColor?: string;
  evoOnly?: boolean;
}

const SPARKLINES: SparklineDef[] = [
  { key: 'r0Eff', label: 'R₀eff', color: 'rgb(74, 222, 128)', referenceLine: 1.0, referenceColor: 'rgba(255,255,255,0.2)' },
  { key: 'meanSurprise', label: 'Surprise', color: 'rgb(251, 146, 60)' },
  { key: 'surprisedPct', label: 'Infected%', color: 'rgb(248, 113, 113)' },
  { key: 'meanHealth', label: 'Health', color: 'rgb(52, 211, 153)' },
  { key: 'meanGeneration', label: 'Generation', color: 'rgb(129, 140, 248)', evoOnly: true },
  { key: 'geneDiversity', label: 'Diversity', color: 'rgb(192, 132, 252)', evoOnly: true },
];

export function SparklineStrip({
  buffers,
  evolutionEnabled,
}: {
  buffers: TimeSeriesBuffers;
  evolutionEnabled: boolean;
}) {
  const visible = evolutionEnabled
    ? SPARKLINES
    : SPARKLINES.filter(s => !s.evoOnly);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-12 flex bg-black/40 backdrop-blur-sm border-t border-white/[0.04]">
      {visible.map(def => (
        <SparklineCell key={def.key} def={def} buffer={buffers[def.key]} />
      ))}
    </div>
  );
}

function SparklineCell({ def, buffer }: { def: SparklineDef; buffer: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawSparkline(ctx, buffer, w, h, def.color, {
      referenceLine: def.referenceLine,
      referenceColor: def.referenceColor,
      filled: true,
    });
  }, [buffer, def]);

  useEffect(() => {
    const id = setInterval(draw, 1000);
    draw();
    return () => clearInterval(id);
  }, [draw]);

  return (
    <div className="flex-1 relative px-1.5 min-w-0">
      <div className="absolute top-0.5 left-2 text-[0.5rem] font-mono text-slate-500 z-10 pointer-events-none">
        {def.label}
        <span className="ml-1 text-slate-400">{buffer.latest?.toFixed?.(3) ?? '—'}</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
