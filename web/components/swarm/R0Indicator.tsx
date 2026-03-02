'use client';

/** Circular R₀ gauge with color-coded criticality regime. */
export function R0Indicator({ r0Eff, r0Base }: { r0Eff: number; r0Base: number }) {
  const { color, glow, label } = getRegime(r0Eff);
  const pulse = (r0Eff >= 0.9 && r0Eff <= 1.1) || r0Eff > 2.0;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[0.7rem] font-mono font-bold border-2 ${pulse ? 'animate-pulse' : ''}`}
        style={{
          borderColor: color,
          boxShadow: `0 0 12px ${glow}, inset 0 0 8px ${glow}`,
          color,
        }}
        title={`R₀eff = ${r0Eff.toFixed(2)} (${label})`}
      >
        {r0Eff.toFixed(1)}
      </div>
      <div className="flex flex-col">
        <span className="text-[0.65rem] font-mono" style={{ color }}>
          R₀ {label}
        </span>
        <span className="text-[0.55rem] font-mono text-slate-500">
          base {r0Base.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function getRegime(r0: number): { color: string; glow: string; label: string } {
  if (r0 < 0.5) return { color: '#60a5fa', glow: 'rgba(96,165,250,0.3)', label: 'dying' };
  if (r0 < 0.9) return { color: '#2dd4bf', glow: 'rgba(45,212,191,0.3)', label: 'subcritical' };
  if (r0 <= 1.1) return { color: '#4ade80', glow: 'rgba(74,222,128,0.4)', label: 'critical' };
  if (r0 <= 2.0) return { color: '#fb923c', glow: 'rgba(251,146,60,0.3)', label: 'supercritical' };
  return { color: '#f87171', glow: 'rgba(248,113,113,0.4)', label: 'pandemic' };
}
