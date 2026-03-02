// Shared TypeScript types for CogOps Observatory

export interface Metrics {
  tick: number;
  nAgents: number;
  meanSurprise: number;
  meanHealth: number;
  meanRefractory: number;
  r0Eff: number;
  r0Base: number;
  surprisedCount: number;
  peakSurprise: number;
  tickMs: number;
  fps: number;
  meanGeneration: number;
  geneDiversity: number;
  evolutionEnabled: boolean;
}

export interface PropagationConfig {
  surpriseDecay: number;
  surpriseTransfer: number;
  distanceFalloff: number;
  refractoryThreshold: number;
  refractoryBuildup: number;
  refractoryDecay: number;
  dangerFeedback: number;
  noveltyEmission: number;
  noveltyAttraction: number;
  dangerEmissionThreshold: number;
}

export interface EvolutionConfig {
  enabled: boolean;
  deathThreshold: number;
  reproductionInterval: number;
  mutationSigma: number;
  healthReward: number;
  healthRewardThreshold: number;
}

export type ColorMode = 'surprise' | 'health' | 'generation' | 'speed' | 'gene_transfer' | 'refractory';

export type Tool = 'shock' | 'danger' | 'novelty' | 'trail';

export interface SliderDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  description: string;
}

export const PROPAGATION_SLIDERS: SliderDef[] = [
  { key: 'surpriseDecay', label: 'Surprise Decay', min: 0.80, max: 0.99, step: 0.005, default: 0.92, description: 'Multiplicative decay per tick. Higher = slower decay, higher R\u2080.' },
  { key: 'surpriseTransfer', label: 'Surprise Transfer', min: 0.01, max: 0.30, step: 0.005, default: 0.08, description: 'Fraction of neighbor surprise absorbed. Higher = more contagious.' },
  { key: 'distanceFalloff', label: 'Distance Falloff', min: 0.5, max: 3.0, step: 0.1, default: 1.0, description: 'Distance weighting exponent. Higher = only nearby agents matter.' },
];

export const REFRACTORY_SLIDERS: SliderDef[] = [
  { key: 'refractoryThreshold', label: 'Threshold', min: 0.1, max: 0.9, step: 0.05, default: 0.6, description: 'Surprise level that triggers immunity buildup.' },
  { key: 'refractoryBuildup', label: 'Buildup Rate', min: 0.05, max: 0.8, step: 0.05, default: 0.3, description: 'How fast immunity accumulates while surprised.' },
  { key: 'refractoryDecay', label: 'Decay Rate', min: 0.90, max: 0.999, step: 0.005, default: 0.98, description: 'Immunity decay when not surprised. Lower = faster recovery.' },
];

export const PHEROMONE_SLIDERS: SliderDef[] = [
  { key: 'dangerFeedback', label: 'Danger Feedback', min: 0.0, max: 0.5, step: 0.01, default: 0.15, description: 'How strongly danger pheromone reignites surprise.' },
  { key: 'noveltyEmission', label: 'Novelty Emission', min: 0.1, max: 0.9, step: 0.05, default: 0.5, description: 'Surprise threshold for emitting novelty beacon.' },
  { key: 'noveltyAttraction', label: 'Novelty Attraction', min: 0.0, max: 0.8, step: 0.05, default: 0.2, description: 'Steering weight toward novelty beacons.' },
  { key: 'dangerEmissionThreshold', label: 'Danger Emission', min: 0.1, max: 0.8, step: 0.05, default: 0.3, description: 'Surprise threshold for emitting danger signal.' },
];

export const EVOLUTION_SLIDERS: SliderDef[] = [
  { key: 'deathThreshold', label: 'Death Threshold', min: 0.01, max: 0.5, step: 0.01, default: 0.1, description: 'Health below this = agent dies and is replaced.' },
  { key: 'reproductionInterval', label: 'Reproduction Interval', min: 1, max: 200, step: 1, default: 50, description: 'Ticks between evolution passes.' },
  { key: 'mutationSigma', label: 'Mutation Rate', min: 0.001, max: 0.2, step: 0.005, default: 0.02, description: 'Gaussian mutation strength on genes.' },
  { key: 'healthReward', label: 'Health Reward', min: 0.0, max: 0.01, step: 0.0005, default: 0.002, description: 'Health boost per tick for surprised agents.' },
  { key: 'healthRewardThreshold', label: 'Reward Threshold', min: 0.05, max: 0.8, step: 0.05, default: 0.3, description: 'Surprise level needed to earn health reward.' },
];

/** Common renderer interface for Canvas2D and WebGL backends. */
export interface ISwarmRenderer {
  render(positions: Float32Array, nAgents: number, worldSize: number, hasPheromones: boolean): void;
  ensureCapacity(n: number): void;
  uploadPheromone(channel: 'danger' | 'trail' | 'novelty', data: Float32Array, res: number): void;
  resize(): void;
  destroy(): void;
  getColorArray(): Float32Array;
  getSizeArray(): Float32Array;
  dangerOn: boolean;
  trailOn: boolean;
  noveltyOn: boolean;
  pheromoneOpacity: number;
}
