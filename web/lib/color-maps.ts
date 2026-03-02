import type { ColorMode } from './types';

/**
 * Color ramps for agent visualization.
 * Each returns [r, g, b, a] in 0-1 range given a normalized value 0-1.
 */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgb(r: number, g: number, b: number, a = 1.0): [number, number, number, number] {
  return [r / 255, g / 255, b / 255, a];
}

// Surprise: slate → amber → orange → red (with glow)
function surpriseColor(v: number): [number, number, number, number] {
  if (v < 0.1) return rgb(100, 116, 139, 0.5);        // slate
  if (v < 0.3) return rgb(251, 191, 36, 0.7);          // amber
  if (v < 0.6) return rgb(249, 115, 22, 0.85);         // orange
  return rgb(239, 68, 68, 1.0);                          // red
}

// Health: emerald → yellow → red
function healthColor(v: number): [number, number, number, number] {
  if (v > 0.7) return [lerp(0.2, 0.13, (v - 0.7) / 0.3), lerp(0.8, 0.95, (v - 0.7) / 0.3), lerp(0.3, 0.35, (v - 0.7) / 0.3), 0.8];
  if (v > 0.3) return [lerp(0.95, 0.2, (v - 0.3) / 0.4), lerp(0.8, 0.8, (v - 0.3) / 0.4), lerp(0.1, 0.3, (v - 0.3) / 0.4), 0.8];
  return [lerp(0.94, 0.95, v / 0.3), lerp(0.27, 0.8, v / 0.3), lerp(0.27, 0.1, v / 0.3), 0.8];
}

// Generation: deep indigo → cyan → mint → gold (viridis-inspired)
function generationColor(v: number): [number, number, number, number] {
  if (v < 0.25) return [lerp(0.15, 0.1, v * 4), lerp(0.1, 0.4, v * 4), lerp(0.4, 0.65, v * 4), 0.8];
  if (v < 0.5) return [lerp(0.1, 0.1, (v - 0.25) * 4), lerp(0.4, 0.7, (v - 0.25) * 4), lerp(0.65, 0.6, (v - 0.25) * 4), 0.8];
  if (v < 0.75) return [lerp(0.1, 0.5, (v - 0.5) * 4), lerp(0.7, 0.85, (v - 0.5) * 4), lerp(0.6, 0.3, (v - 0.5) * 4), 0.85];
  return [lerp(0.5, 0.95, (v - 0.75) * 4), lerp(0.85, 0.85, (v - 0.75) * 4), lerp(0.3, 0.15, (v - 0.75) * 4), 0.9];
}

// Speed: cool blue → hot magenta
function speedColor(v: number): [number, number, number, number] {
  return [lerp(0.15, 0.95, v), lerp(0.3, 0.2, v), lerp(0.85, 0.75, v), lerp(0.5, 1.0, v)];
}

// Gene transfer: indigo → white → crimson
function geneTransferColor(v: number): [number, number, number, number] {
  if (v < 0.5) {
    const t = v * 2;
    return [lerp(0.2, 0.9, t), lerp(0.15, 0.9, t), lerp(0.6, 0.95, t), 0.8];
  }
  const t = (v - 0.5) * 2;
  return [lerp(0.9, 0.9, t), lerp(0.9, 0.2, t), lerp(0.95, 0.2, t), 0.8];
}

// Refractory: transparent slate → bright amber
function refractoryColor(v: number): [number, number, number, number] {
  if (v < 0.1) return rgb(100, 116, 139, 0.25);
  return [lerp(0.4, 0.98, v), lerp(0.45, 0.75, v), lerp(0.55, 0.14, v), lerp(0.3, 1.0, v)];
}

export const COLOR_MODES: { mode: ColorMode; label: string; shortLabel: string }[] = [
  { mode: 'surprise', label: 'Surprise', shortLabel: 'S' },
  { mode: 'health', label: 'Health', shortLabel: 'H' },
  { mode: 'generation', label: 'Generation', shortLabel: 'G' },
  { mode: 'speed', label: 'Speed', shortLabel: 'V' },
  { mode: 'gene_transfer', label: 'Gene: Transfer', shortLabel: 'T' },
  { mode: 'refractory', label: 'Refractory', shortLabel: 'R' },
];

export function getColorForMode(mode: ColorMode, value: number): [number, number, number, number] {
  switch (mode) {
    case 'surprise': return surpriseColor(value);
    case 'health': return healthColor(value);
    case 'generation': return generationColor(value);
    case 'speed': return speedColor(value);
    case 'gene_transfer': return geneTransferColor(value);
    case 'refractory': return refractoryColor(value);
  }
}

/** Get point size multiplier for a color mode + value. */
export function getPointSize(mode: ColorMode, value: number): number {
  if (mode === 'surprise') {
    if (value > 0.6) return 3.0;
    if (value > 0.3) return 2.2;
    if (value > 0.1) return 1.6;
    return 1.0;
  }
  return lerp(1.0, 2.5, value);
}
