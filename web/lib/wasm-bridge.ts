/**
 * Type-safe bridge to the CogOps WASM engine.
 * Handles loading, memory views, and provides a clean API.
 */
import type { PropagationConfig, EvolutionConfig, ColorMode, Metrics } from './types';

export interface WasmEngine {
  instance: any; // WasmSwarmEngine instance
  memory: WebAssembly.Memory;
}

/** Load the WASM module and return engine constructor + memory. */
export async function loadWasm(): Promise<{ glue: any; memory: WebAssembly.Memory }> {
  const wasmResponse = await fetch('/wasm/cogops_wasm_bg.wasm');
  const wasmBytes = await wasmResponse.arrayBuffer();

  // Dynamic import to bypass TS module resolution for WASM glue
  // eslint-disable-next-line no-new-func
  const importFn = new Function('url', 'return import(url)');
  const glue = await importFn('/wasm/cogops_wasm.js');

  const wasmExports = glue.initSync({ module: new WebAssembly.Module(wasmBytes) });
  return { glue, memory: wasmExports.memory };
}

/** Create a new engine instance. */
export function createEngine(glue: any, nAgents: number, worldSize: number): any {
  return new glue.WasmSwarmEngine(nAgents, worldSize);
}

/** Read metrics from engine. */
export function readMetrics(engine: any, tickMs: number, fps: number): Metrics {
  return {
    tick: Number(engine.get_tick()),
    nAgents: engine.n_agents(),
    meanSurprise: engine.mean_surprise(),
    meanHealth: engine.mean_health(),
    meanRefractory: engine.mean_refractory(),
    r0Eff: engine.r0_effective(),
    r0Base: engine.r0_base(),
    surprisedCount: engine.surprised_count(),
    peakSurprise: engine.peak_surprise(),
    tickMs,
    fps,
    meanGeneration: engine.mean_generation(),
    geneDiversity: engine.gene_diversity(),
    evolutionEnabled: engine.evolution_enabled(),
  };
}

/** Apply a propagation config to the engine via individual setters. */
export function applyPropagationConfig(engine: any, cfg: PropagationConfig) {
  engine.set_surprise_decay(cfg.surpriseDecay);
  engine.set_surprise_transfer(cfg.surpriseTransfer);
  engine.set_distance_falloff(cfg.distanceFalloff);
  engine.set_refractory_threshold(cfg.refractoryThreshold);
  engine.set_refractory_buildup(cfg.refractoryBuildup);
  engine.set_refractory_decay(cfg.refractoryDecay);
  engine.set_danger_feedback(cfg.dangerFeedback);
  engine.set_novelty_emission(cfg.noveltyEmission);
  engine.set_novelty_attraction(cfg.noveltyAttraction);
  engine.set_danger_emission_threshold(cfg.dangerEmissionThreshold);
}

/** Apply an evolution config to the engine. */
export function applyEvolutionConfig(engine: any, cfg: EvolutionConfig) {
  engine.set_evolution_enabled(cfg.enabled);
  engine.set_death_threshold(cfg.deathThreshold);
  engine.set_reproduction_interval(cfg.reproductionInterval);
  engine.set_mutation_sigma(cfg.mutationSigma);
  engine.set_health_reward(cfg.healthReward);
  engine.set_health_reward_threshold(cfg.healthRewardThreshold);
}

/** Get zero-copy Float32Array view of positions [x0,y0,x1,y1,...]. */
export function getPositions(engine: any, memory: WebAssembly.Memory, n: number): Float32Array {
  const ptr = engine.get_positions_ptr();
  return new Float32Array(memory.buffer, ptr, n * 2);
}

/** Get zero-copy data view for a color mode. */
export function getDataForColorMode(
  engine: any,
  memory: WebAssembly.Memory,
  mode: ColorMode,
  n: number,
): { data: Float32Array | Uint32Array; isU32?: boolean } {
  const buf = memory.buffer;
  switch (mode) {
    case 'surprise':
      return { data: new Float32Array(buf, engine.get_surprise_ptr(), n) };
    case 'health':
      return { data: new Float32Array(buf, engine.get_health_ptr(), n) };
    case 'generation':
      return { data: new Uint32Array(buf, engine.get_generation_ptr(), n), isU32: true };
    case 'speed': {
      // Compute speed magnitude from vx, vy
      const vx = new Float32Array(buf, engine.get_vx_ptr(), n);
      const vy = new Float32Array(buf, engine.get_vy_ptr(), n);
      const speeds = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        speeds[i] = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      }
      return { data: speeds };
    }
    case 'gene_transfer':
      return { data: new Float32Array(buf, engine.get_gene_transfer_ptr(), n) };
    case 'refractory':
      return { data: new Float32Array(buf, engine.get_refractory_ptr(), n) };
  }
}

/** Get pheromone channel data. */
export function getPheromoneData(
  engine: any,
  memory: WebAssembly.Memory,
  channel: number,
  res: number,
): Float32Array {
  const ptr = engine.get_pheromone_ptr(channel);
  return new Float32Array(memory.buffer, ptr, res * res);
}
