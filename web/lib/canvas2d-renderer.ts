/**
 * Canvas2D renderer for ≤50K agents.
 * Batched arc() calls, no shaders, proven CPU path.
 * Pheromone overlay via ImageData heatmap.
 */
import type { ISwarmRenderer } from './types';

export class Canvas2DRenderer implements ISwarmRenderer {
  private ctx: CanvasRenderingContext2D;
  private colorArray: Float32Array;
  private sizeArray: Float32Array;
  private allocatedAgents: number;

  // Pheromone data buffers
  private pheroData: Record<string, { data: Float32Array; res: number }> = {
    danger: { data: new Float32Array(0), res: 0 },
    trail: { data: new Float32Array(0), res: 0 },
    novelty: { data: new Float32Array(0), res: 0 },
  };

  // Pheromone state
  public dangerOn = true;
  public trailOn = false;
  public noveltyOn = true;
  public pheromoneOpacity = 0.25;

  constructor(private canvas: HTMLCanvasElement, maxAgents: number) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas2D not supported');
    this.ctx = ctx;
    this.colorArray = new Float32Array(maxAgents * 4);
    this.sizeArray = new Float32Array(maxAgents);
    this.allocatedAgents = maxAgents;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ensureCapacity(n: number) {
    if (n <= this.allocatedAgents) return;
    this.colorArray = new Float32Array(n * 4);
    this.sizeArray = new Float32Array(n);
    this.allocatedAgents = n;
  }

  getColorArray(): Float32Array { return this.colorArray; }
  getSizeArray(): Float32Array { return this.sizeArray; }

  uploadPheromone(channel: 'danger' | 'trail' | 'novelty', data: Float32Array, res: number) {
    // Store a copy since WASM memory can be invalidated
    const copy = this.pheroData[channel];
    if (copy.res !== res || copy.data.length !== data.length) {
      copy.data = new Float32Array(data.length);
      copy.res = res;
    }
    copy.data.set(data);
  }

  render(positions: Float32Array, nAgents: number, worldSize: number, hasPheromones: boolean) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    // World-to-screen transform (matches WebGL's 92% centered viewport)
    const mapSize = Math.min(w, h) * 0.92;
    const ox = (w - mapSize) / 2;
    const oy = (h - mapSize) / 2;
    const scale = mapSize / worldSize;

    // Pheromone overlay (behind agents)
    if (hasPheromones && (this.dangerOn || this.trailOn || this.noveltyOn)) {
      this.renderPheromones(ctx, ox, oy, mapSize);
    }

    // Batch agents by color bucket for fewer style switches
    // At ≤50K agents, we render all of them — no stride sampling needed
    ctx.globalCompositeOperation = 'lighter'; // additive blending like WebGL

    for (let i = 0; i < nAgents; i++) {
      const px = positions[i * 2];
      const py = positions[i * 2 + 1];
      const sx = ox + px * scale;
      const sy = oy + py * scale;

      const r = this.colorArray[i * 4];
      const g = this.colorArray[i * 4 + 1];
      const b = this.colorArray[i * 4 + 2];
      const a = this.colorArray[i * 4 + 3];
      const size = this.sizeArray[i] * 0.8; // scale down slightly for Canvas2D

      ctx.fillStyle = `rgba(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0},${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private renderPheromones(
    ctx: CanvasRenderingContext2D,
    ox: number, oy: number, mapSize: number,
  ) {
    const channels: Array<{ key: string; on: boolean; color: [number, number, number] }> = [
      { key: 'danger', on: this.dangerOn, color: [242, 89, 38] },
      { key: 'trail', on: this.trailOn, color: [51, 102, 230] },
      { key: 'novelty', on: this.noveltyOn, color: [179, 51, 230] },
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = this.pheromoneOpacity;

    for (const ch of channels) {
      if (!ch.on) continue;
      const pd = this.pheroData[ch.key];
      if (!pd.res || pd.data.length === 0) continue;

      const res = pd.res;
      const cellW = mapSize / res;
      const cellH = mapSize / res;

      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const val = pd.data[y * res + x];
          if (val < 0.01) continue;

          const intensity = Math.min(val * 2, 1);
          ctx.fillStyle = `rgba(${ch.color[0]},${ch.color[1]},${ch.color[2]},${intensity.toFixed(2)})`;
          ctx.fillRect(ox + x * cellW, oy + y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    ctx.restore();
  }

  destroy() {
    // Nothing to clean up for Canvas2D
    this.colorArray = new Float32Array(0);
    this.sizeArray = new Float32Array(0);
  }
}
