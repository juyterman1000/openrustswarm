'use client';

import { COLOR_MODES } from '../../lib/color-maps';
import type { ColorMode } from '../../lib/types';

/** Floating pill buttons for color mode selection — bottom-right. */
export function ColorModeSelector({
  active,
  onChange,
  evolutionEnabled,
}: {
  active: ColorMode;
  onChange: (mode: ColorMode) => void;
  evolutionEnabled: boolean;
}) {
  const modes = evolutionEnabled
    ? COLOR_MODES
    : COLOR_MODES.filter(m => m.mode !== 'generation' && m.mode !== 'gene_transfer');

  return (
    <div className="absolute bottom-16 right-4 z-30 flex gap-1.5">
      {modes.map(({ mode, label, shortLabel }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`w-8 h-8 rounded-full text-[0.65rem] font-bold transition-all ${
            active === mode
              ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)] scale-110'
              : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
          }`}
          title={label}
        >
          {shortLabel}
        </button>
      ))}
    </div>
  );
}
