'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentCanvas } from './AgentCanvas';
import { FloatingHUD } from './FloatingHUD';
import { ParameterPanel } from './ParameterPanel';
import { SparklineStrip } from './SparklineStrip';
import { ColorModeSelector } from './ColorModeSelector';
import { useWasmEngine } from '../../hooks/useWasmEngine';
import { useSimulationLoop } from '../../hooks/useSimulationLoop';
import { useTimeSeriesHistory } from '../../hooks/useTimeSeriesHistory';
import type { ColorMode, Tool, ISwarmRenderer } from '../../lib/types';
import { PRESETS, type Preset } from '../../lib/presets';


/** Agent count tiers for the scale selector. */
const AGENT_SCALES = [
  { label: '10', value: 10 },
  { label: '100', value: 100 },
  { label: '1K', value: 1_000 },
  { label: '10K', value: 10_000 },
  { label: '50K', value: 50_000 },
  { label: '200K', value: 200_000 },
  { label: '500K', value: 500_000 },
  { label: '1M', value: 1_000_000 },
];

export function SwarmWorkstation() {
  const {
    ready, loadProgress, getHandle, applyPreset,
    setPropagationParam, setEvolutionParam, reinit,
    currentAgentCount, engineRef,
  } = useWasmEngine();
  const rendererRef = useRef<ISwarmRenderer | null>(null);
  const { buffers, record, clear: clearHistory } = useTimeSeriesHistory();
  const { running, metrics, colorMode, setColorMode, start, pause, toggle, stepN } = useSimulationLoop(
    getHandle,
    rendererRef,
    record,
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('critical');
  const [activeTool, setActiveTool] = useState<Tool>('shock');

  // Auto-start on ready
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (ready && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setTimeout(() => start(), 100);
    }
  }, [ready, start]);

  const handleRendererReady = useCallback((renderer: ISwarmRenderer) => {
    rendererRef.current = renderer;
  }, []);

  const handlePreset = useCallback((preset: Preset) => {
    applyPreset(preset);
    setActivePreset(preset.key);
  }, [applyPreset]);

  const handleReset = useCallback(() => {
    const eng = engineRef.current;
    if (eng) {
      eng.reset();
      clearHistory();
    }
  }, [engineRef, clearHistory]);

  const handleAgentCountChange = useCallback((newCount: number) => {
    const wasRunning = running;
    if (wasRunning) pause();

    const ok = reinit(newCount);
    if (ok) {
      clearHistory();
      // Re-apply active preset
      if (activePreset) {
        const preset = PRESETS.find(p => p.key === activePreset);
        if (preset) applyPreset(preset);
      }
    }

    if (wasRunning) setTimeout(() => start(), 50);
  }, [running, pause, start, reinit, clearHistory, activePreset, applyPreset]);

  const getEngineValue = useCallback((key: string): number => {
    const eng = engineRef.current;
    if (!eng) return 0;
    const getter = `get_${key.replace(/[A-Z]/g, m => '_' + m.toLowerCase())}`;
    if (typeof eng[getter] === 'function') return eng[getter]();
    return 0;
  }, [engineRef]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'Tab':
          e.preventDefault();
          setPanelOpen(p => !p);
          break;
        case 'e':
        case 'E': {
          const eng = engineRef.current;
          if (eng) {
            const next = !eng.evolution_enabled();
            eng.set_evolution_enabled(next);
          }
          break;
        }
        case 'c':
        case 'C': {
          const modes: ColorMode[] = ['surprise', 'health', 'generation', 'speed', 'gene_transfer', 'refractory'];
          const idx = modes.indexOf(colorMode);
          setColorMode(modes[(idx + 1) % modes.length]);
          break;
        }
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) handleReset();
          break;
        case '1': handlePreset(PRESETS[0]); break;
        case '2': handlePreset(PRESETS[1]); break;
        case '3': handlePreset(PRESETS[2]); break;
        case '4': handlePreset(PRESETS[3]); break;
        case '5': handlePreset(PRESETS[4]); break;
        case '.':
          if (!running) stepN(1);
          break;
        case '>':
          if (!running) stepN(10);
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggle, colorMode, setColorMode, handleReset, handlePreset, running, stepN, engineRef]);

  // Loading screen
  if (!ready) {
    return (
      <div className="fixed inset-0 bg-[#050812] flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-6 flex items-center justify-center text-4xl shadow-[0_0_60px_rgba(99,102,241,0.4)] animate-pulse">
            &#9889;
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
            CogOps Observatory
          </div>
          <div className="text-sm text-slate-400 mb-6">
            {loadProgress || 'Preparing...'}
          </div>
          <div className="w-48 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[loading_2s_ease-in-out_infinite]"
              style={{ width: '60%' }}
            />
          </div>
          <div className="text-[0.65rem] text-slate-600 font-mono mt-6">
            Evolving minds · WebAssembly v4.0.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0e1a] text-slate-200 overflow-hidden">
      {/* WebGL Canvas (full-screen) */}
      <AgentCanvas
        getHandle={getHandle}
        activeTool={activeTool}
        agentCount={currentAgentCount}
        onRendererReady={handleRendererReady}
      />

      {/* Floating HUD */}
      <FloatingHUD metrics={metrics} />

      {/* Color Mode Selector */}
      <ColorModeSelector
        active={colorMode}
        onChange={setColorMode}
        evolutionEnabled={metrics.evolutionEnabled}
      />

      {/* Sparkline Strip */}
      <SparklineStrip buffers={buffers} evolutionEnabled={metrics.evolutionEnabled} />

      {/* Parameter Panel */}
      <ParameterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        activePreset={activePreset}
        onPreset={handlePreset}
        onPropagationChange={setPropagationParam}
        onEvolutionChange={setEvolutionParam}
        evolutionEnabled={metrics.evolutionEnabled}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        getEngineValue={getEngineValue}
        agentCount={currentAgentCount}
        onAgentCountChange={handleAgentCountChange}
        agentScales={AGENT_SCALES}
      />

      {/* Pause overlay */}
      {!running && metrics.tick > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="text-white/20 text-6xl font-bold tracking-wider animate-pulse">PAUSED</div>
          <div className="text-center text-white/10 text-sm font-mono mt-2">
            Space to resume · . to step · Tab for panel
          </div>
        </div>
      )}

      {/* Bottom keyboard hints */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 text-[0.55rem] font-mono text-slate-600 pointer-events-none">
        Space pause · Tab panel · 1-5 presets · E evolve · C colors · Click to shock
      </div>
    </div>
  );
}
