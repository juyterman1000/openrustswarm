'use client';

import { PRESETS, type Preset } from '../../lib/presets';

export function PresetSelector({
  activeKey,
  onSelect,
}: {
  activeKey: string | null;
  onSelect: (preset: Preset) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {PRESETS.map(preset => (
        <button
          key={preset.key}
          onClick={() => onSelect(preset)}
          className={`text-left px-3 py-2 rounded-lg border transition-all ${
            activeKey === preset.key
              ? 'bg-blue-500/[0.12] border-blue-500/40 text-blue-300'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.8rem] font-medium">{preset.name}</span>
            <kbd className="text-[0.6rem] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{preset.shortcut}</kbd>
          </div>
          <div className="text-[0.65rem] text-slate-500 mt-0.5">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}
