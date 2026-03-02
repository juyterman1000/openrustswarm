'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadWasm, createEngine, applyPropagationConfig, applyEvolutionConfig } from '../lib/wasm-bridge';
import type { Preset } from '../lib/presets';

const DEFAULT_AGENT_COUNT = 200_000;
const DEFAULT_WORLD_SIZE = 1000.0;

export interface EngineHandle {
  engine: any;
  memory: WebAssembly.Memory;
  nAgents: number;
  worldSize: number;
}

export function useWasmEngine(initialAgentCount?: number) {
  const nAgents = initialAgentCount ?? DEFAULT_AGENT_COUNT;
  const worldSize = DEFAULT_WORLD_SIZE;

  const engineRef = useRef<any>(null);
  const memoryRef = useRef<WebAssembly.Memory | null>(null);
  const glueRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [currentAgentCount, setCurrentAgentCount] = useState(nAgents);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoadProgress('Downloading WASM module...');
        const { glue, memory } = await loadWasm();
        if (cancelled) return;

        glueRef.current = glue;
        setLoadProgress(`Initializing ${nAgents.toLocaleString()} agents...`);
        memoryRef.current = memory;
        const eng = createEngine(glue, nAgents, worldSize);
        if (cancelled) return;

        engineRef.current = eng;
        setCurrentAgentCount(nAgents);
        setReady(true);
      } catch (err) {
        console.error('WASM init failed:', err);
        setLoadProgress('Failed to load WASM engine');
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHandle = useCallback((): EngineHandle | null => {
    if (!engineRef.current || !memoryRef.current) return null;
    return {
      engine: engineRef.current,
      memory: memoryRef.current,
      nAgents: engineRef.current.n_agents(),
      worldSize,
    };
  }, [worldSize]);

  /** Reinitialize the engine with a different agent count. Returns true on success. */
  const reinit = useCallback((newCount: number): boolean => {
    const glue = glueRef.current;
    if (!glue) return false;

    try {
      // Free old engine
      engineRef.current?.free?.();

      const eng = createEngine(glue, newCount, worldSize);
      engineRef.current = eng;
      setCurrentAgentCount(newCount);
      return true;
    } catch (err) {
      console.error('Reinit failed:', err);
      return false;
    }
  }, [worldSize]);

  const applyPreset = useCallback((preset: Preset) => {
    const eng = engineRef.current;
    if (!eng) return;
    applyPropagationConfig(eng, preset.propagation);
    applyEvolutionConfig(eng, preset.evolution);
  }, []);

  const setPropagationParam = useCallback((key: string, value: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const setter = `set_${key.replace(/[A-Z]/g, m => '_' + m.toLowerCase())}`;
    if (typeof eng[setter] === 'function') {
      eng[setter](value);
    }
  }, []);

  const setEvolutionParam = useCallback((key: string, value: number | boolean) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (key === 'enabled') {
      eng.set_evolution_enabled(value as boolean);
      return;
    }
    const setter = `set_${key.replace(/[A-Z]/g, m => '_' + m.toLowerCase())}`;
    if (typeof eng[setter] === 'function') {
      eng[setter](value);
    }
  }, []);

  return {
    ready,
    loadProgress,
    getHandle,
    applyPreset,
    setPropagationParam,
    setEvolutionParam,
    reinit,
    currentAgentCount,
    engineRef,
    memoryRef,
  };
}
