'use client';

import { useState } from 'react';
import { PresetSelector } from './PresetSelector';
import type { Preset } from '../../lib/presets';
import type { SliderDef, Tool } from '../../lib/types';
import {
  PROPAGATION_SLIDERS,
  REFRACTORY_SLIDERS,
  PHEROMONE_SLIDERS,
  EVOLUTION_SLIDERS,
} from '../../lib/types';

interface ParameterPanelProps {
  open: boolean;
  onClose: () => void;
  activePreset: string | null;
  onPreset: (preset: Preset) => void;
  onPropagationChange: (key: string, value: number) => void;
  onEvolutionChange: (key: string, value: number | boolean) => void;
  evolutionEnabled: boolean;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  getEngineValue: (key: string) => number;
  agentCount: number;
  onAgentCountChange: (count: number) => void;
  agentScales: { label: string; value: number }[];
}

export function ParameterPanel({
  open,
  onClose,
  activePreset,
  onPreset,
  onPropagationChange,
  onEvolutionChange,
  evolutionEnabled,
  activeTool,
  onToolChange,
  getEngineValue,
  agentCount,
  onAgentCountChange,
  agentScales,
}: ParameterPanelProps) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-[320px] z-40 transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full bg-[rgba(10,14,26,0.85)] backdrop-blur-2xl border-l border-white/[0.06] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Observatory</h2>
            <div className="text-[0.6rem] text-slate-500 font-mono mt-0.5">CogOps v4.0.0</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center text-sm transition-all"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Agent Scale */}
          <Section title="Agent Scale">
            <div className="flex flex-wrap gap-1.5">
              {agentScales.map(s => (
                <button
                  key={s.value}
                  onClick={() => onAgentCountChange(s.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[0.7rem] font-mono border transition-all ${
                    agentCount === s.value
                      ? 'bg-emerald-500/[0.15] border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="text-[0.6rem] text-slate-500 mt-2">
              {agentCount.toLocaleString()} agents · Resources scale proportionally
            </div>
          </Section>

          {/* Presets */}
          <Section title="Presets">
            <PresetSelector activeKey={activePreset} onSelect={onPreset} />
          </Section>

          {/* SIRS Dynamics */}
          <Section title="SIRS Dynamics">
            {PROPAGATION_SLIDERS.map(s => (
              <ParamSlider
                key={s.key}
                def={s}
                value={getEngineValue(s.key)}
                onChange={v => onPropagationChange(s.key, v)}
              />
            ))}
          </Section>

          {/* Refractory */}
          <Section title="Refractory System">
            {REFRACTORY_SLIDERS.map(s => (
              <ParamSlider
                key={s.key}
                def={s}
                value={getEngineValue(s.key)}
                onChange={v => onPropagationChange(s.key, v)}
              />
            ))}
          </Section>

          {/* Pheromones */}
          <Section title="Pheromone Behavior">
            {PHEROMONE_SLIDERS.map(s => (
              <ParamSlider
                key={s.key}
                def={s}
                value={getEngineValue(s.key)}
                onChange={v => onPropagationChange(s.key, v)}
              />
            ))}
          </Section>

          {/* Evolution */}
          <Section title="Evolution">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.75rem] text-slate-300">Darwinian Evolution</span>
              <button
                onClick={() => onEvolutionChange('enabled', !evolutionEnabled)}
                className={`px-3 py-1 rounded-lg text-[0.7rem] font-medium border transition-all ${
                  evolutionEnabled
                    ? 'bg-purple-500/[0.15] border-purple-500/40 text-purple-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                {evolutionEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            {evolutionEnabled && EVOLUTION_SLIDERS.map(s => (
              <ParamSlider
                key={s.key}
                def={s}
                value={getEngineValue(s.key)}
                onChange={v => onEvolutionChange(s.key, v)}
              />
            ))}
          </Section>

          {/* Tools */}
          <Section title="Placement Tools">
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[0.78rem] border transition-all ${
                    activeTool === tool.id
                      ? 'bg-blue-500/[0.12] border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-base">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-white/[0.04] text-center text-[0.55rem] text-slate-600 font-mono">
          Tab to toggle · 1-5 presets · Space pause
        </div>
      </div>
    </div>
  );
}

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'shock', icon: '\u26A1', label: 'Shockwave' },
  { id: 'danger', icon: '\u26A0\uFE0F', label: 'Danger' },
  { id: 'novelty', icon: '\u2728', label: 'Novelty' },
  { id: 'trail', icon: '\uD83D\uDC63', label: 'Trail' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium mb-2 hover:text-slate-300 transition-colors"
      >
        {title}
        <span className="text-[0.7rem]">{open ? '−' : '+'}</span>
      </button>
      {open && children}
    </div>
  );
}

function ParamSlider({
  def,
  value,
  onChange,
}: {
  def: SliderDef;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.7rem] text-slate-300" title={def.description}>{def.label}</span>
        <span className="text-[0.65rem] font-mono text-slate-400">{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(96,165,250,0.5)]
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:border-0"
      />
    </div>
  );
}
