'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readMetrics, getPositions, getDataForColorMode, getPheromoneData } from '../lib/wasm-bridge';
import { getColorForMode, getPointSize } from '../lib/color-maps';
import type { Metrics, ColorMode, ISwarmRenderer } from '../lib/types';
import type { EngineHandle } from './useWasmEngine';

export interface SimulationState {
  running: boolean;
  metrics: Metrics;
  colorMode: ColorMode;
}

const INITIAL_METRICS: Metrics = {
  tick: 0, nAgents: 0, meanSurprise: 0, meanHealth: 0,
  meanRefractory: 0, r0Eff: 0, r0Base: 0, surprisedCount: 0,
  peakSurprise: 0, tickMs: 0, fps: 0,
  meanGeneration: 0, geneDiversity: 0, evolutionEnabled: false,
};

export function useSimulationLoop(
  getHandle: () => EngineHandle | null,
  rendererRef: React.MutableRefObject<ISwarmRenderer | null>,
  onMetrics?: (m: Metrics) => void,
) {
  const runningRef = useRef(false);
  const animRef = useRef(0);
  const colorModeRef = useRef<ColorMode>('surprise');
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [colorMode, setColorModeState] = useState<ColorMode>('surprise');
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), value: 0 });

  // Auto-inject surprise at tick 5
  const autoInjectedRef = useRef(false);

  const setColorMode = useCallback((mode: ColorMode) => {
    colorModeRef.current = mode;
    setColorModeState(mode);
  }, []);

  const loop = useCallback(() => {
    const handle = getHandle();
    const renderer = rendererRef.current;

    if (!handle || !renderer) {
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    const { engine, memory, nAgents, worldSize } = handle;

    // Ensure renderer buffers match current agent count
    renderer.ensureCapacity(nAgents);

    if (runningRef.current) {
      const t0 = performance.now();
      engine.tick();
      const tickMs = performance.now() - t0;

      // Auto-inject surprise shockwave at tick 5
      const tick = Number(engine.get_tick());
      if (!autoInjectedRef.current && tick >= 5) {
        autoInjectedRef.current = true;
        engine.inject_surprise(worldSize / 2, worldSize / 2, 80, 0.9);
      }

      // FPS tracking
      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.value = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }

      const m = readMetrics(engine, tickMs, fpsRef.current.value);
      setMetrics(m);
      onMetrics?.(m);
    }

    // Read positions
    const positions = getPositions(engine, memory, nAgents);

    // Compute colors based on active mode
    const mode = colorModeRef.current;
    const { data, isU32 } = getDataForColorMode(engine, memory, mode, nAgents);
    const colors = renderer.getColorArray();
    const sizes = renderer.getSizeArray();

    // Normalization ranges for different modes
    let maxVal = 1.0;
    if (mode === 'generation') {
      // Find max generation for normalization
      let maxG = 1;
      const d = data as Uint32Array;
      for (let i = 0; i < nAgents; i++) {
        if (d[i] > maxG) maxG = d[i];
      }
      maxVal = maxG;
    } else if (mode === 'speed') {
      let maxS = 0.01;
      for (let i = 0; i < nAgents; i++) {
        if ((data as Float32Array)[i] > maxS) maxS = (data as Float32Array)[i];
      }
      maxVal = maxS;
    }

    for (let i = 0; i < nAgents; i++) {
      const raw = isU32 ? (data as Uint32Array)[i] : (data as Float32Array)[i];
      const v = Math.min(raw / maxVal, 1.0);
      const [r, g, b, a] = getColorForMode(mode, v);
      colors[i * 4] = r;
      colors[i * 4 + 1] = g;
      colors[i * 4 + 2] = b;
      colors[i * 4 + 3] = a;
      sizes[i] = getPointSize(mode, v);
    }

    // Upload pheromone data
    const pheroRes = engine.pheromone_resolution();
    const hasPheromones = pheroRes > 0;
    if (hasPheromones) {
      const danger = getPheromoneData(engine, memory, 1, pheroRes);
      const trail = getPheromoneData(engine, memory, 2, pheroRes);
      const novelty = getPheromoneData(engine, memory, 4, pheroRes);
      renderer.uploadPheromone('danger', danger, pheroRes);
      renderer.uploadPheromone('trail', trail, pheroRes);
      renderer.uploadPheromone('novelty', novelty, pheroRes);
    }

    renderer.render(positions, nAgents, worldSize, hasPheromones);

    animRef.current = requestAnimationFrame(loop);
  }, [getHandle, rendererRef, onMetrics]);

  const start = useCallback(() => {
    runningRef.current = true;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);

  const toggle = useCallback(() => {
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  }, []);

  const stepN = useCallback((n: number) => {
    const handle = getHandle();
    if (!handle) return;
    handle.engine.step(n);
    const m = readMetrics(handle.engine, 0, fpsRef.current.value);
    setMetrics(m);
    onMetrics?.(m);
  }, [getHandle, onMetrics]);

  // Start/stop animation loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [loop]);

  return {
    running,
    metrics,
    colorMode,
    setColorMode,
    start,
    pause,
    toggle,
    stepN,
  };
}
