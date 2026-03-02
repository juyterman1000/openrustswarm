import type { PropagationConfig, EvolutionConfig } from './types';

export interface Preset {
  name: string;
  key: string;
  description: string;
  shortcut: string;
  propagation: PropagationConfig;
  evolution: EvolutionConfig;
}

// R0_base = transfer / (1 - decay)
const DEFAULTS: PropagationConfig = {
  surpriseDecay: 0.92,
  surpriseTransfer: 0.08,
  distanceFalloff: 1.0,
  refractoryThreshold: 0.6,
  refractoryBuildup: 0.3,
  refractoryDecay: 0.98,
  dangerFeedback: 0.15,
  noveltyEmission: 0.5,
  noveltyAttraction: 0.2,
  dangerEmissionThreshold: 0.3,
};

const EVO_OFF: EvolutionConfig = {
  enabled: false,
  deathThreshold: 0.1,
  reproductionInterval: 50,
  mutationSigma: 0.02,
  healthReward: 0.002,
  healthRewardThreshold: 0.3,
};

export const PRESETS: Preset[] = [
  {
    name: 'Critical Edge',
    key: 'critical',
    description: 'R\u2080 \u2248 1.0 \u2014 Phase transition. Maximum sensitivity.',
    shortcut: '1',
    propagation: { ...DEFAULTS },
    evolution: { ...EVO_OFF },
  },
  {
    name: 'Pandemic',
    key: 'pandemic',
    description: 'R\u2080 \u2248 3.0 \u2014 Rapid global infection wave.',
    shortcut: '2',
    propagation: {
      ...DEFAULTS,
      surpriseDecay: 0.95,
      surpriseTransfer: 0.15,
    },
    evolution: { ...EVO_OFF },
  },
  {
    name: 'Subcritical',
    key: 'subcritical',
    description: 'R\u2080 \u2248 0.3 \u2014 Infections die out. Local clusters only.',
    shortcut: '3',
    propagation: {
      ...DEFAULTS,
      surpriseDecay: 0.85,
      surpriseTransfer: 0.045,
    },
    evolution: { ...EVO_OFF },
  },
  {
    name: 'Evolution Lab',
    key: 'evolution',
    description: 'Darwinian evolution active. Watch species diverge.',
    shortcut: '4',
    propagation: { ...DEFAULTS },
    evolution: {
      enabled: true,
      deathThreshold: 0.1,
      reproductionInterval: 50,
      mutationSigma: 0.02,
      healthReward: 0.002,
      healthRewardThreshold: 0.3,
    },
  },
  {
    name: 'Extreme Evolution',
    key: 'extreme',
    description: 'High mutation, fast selection. Rapid speciation.',
    shortcut: '5',
    propagation: {
      ...DEFAULTS,
      surpriseDecay: 0.93,
      surpriseTransfer: 0.10,
    },
    evolution: {
      enabled: true,
      deathThreshold: 0.2,
      reproductionInterval: 20,
      mutationSigma: 0.08,
      healthReward: 0.003,
      healthRewardThreshold: 0.25,
    },
  },
];
