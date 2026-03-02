import { RingBuffer } from './ring-buffer';

/**
 * Lightweight Canvas2D sparkline renderer.
 * Draws a mini time-series chart with optional reference line.
 */
export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  buffer: RingBuffer,
  width: number,
  height: number,
  color: string,
  options?: {
    referenceLine?: number;
    referenceColor?: string;
    minY?: number;
    maxY?: number;
    filled?: boolean;
  },
) {
  const data = buffer.getAll();
  const n = data.length;
  if (n < 2) return;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  // Compute Y range
  let minY = options?.minY ?? Infinity;
  let maxY = options?.maxY ?? -Infinity;
  if (minY === Infinity || maxY === -Infinity) {
    for (let i = 0; i < n; i++) {
      if (data[i] < minY) minY = data[i];
      if (data[i] > maxY) maxY = data[i];
    }
    // Add 10% margin
    const margin = (maxY - minY) * 0.1 || 0.01;
    if (options?.minY === undefined) minY -= margin;
    if (options?.maxY === undefined) maxY += margin;
  }

  const range = maxY - minY || 1;

  ctx.clearRect(0, 0, width, height);

  // Reference line
  if (options?.referenceLine !== undefined) {
    const refY = padding + h - ((options.referenceLine - minY) / range) * h;
    if (refY >= padding && refY <= height - padding) {
      ctx.strokeStyle = options.referenceColor || 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding, refY);
      ctx.lineTo(width - padding, refY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Data line
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = padding + (i / (n - 1)) * w;
    const y = padding + h - ((data[i] - minY) / range) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  if (options?.filled) {
    ctx.lineTo(padding + w, padding + h);
    ctx.lineTo(padding, padding + h);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb(', 'rgba(');
    ctx.fill();
    // Redraw the line on top
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = padding + (i / (n - 1)) * w;
      const y = padding + h - ((data[i] - minY) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Latest value dot
  if (n > 0) {
    const lastX = padding + w;
    const lastY = padding + h - ((data[n - 1] - minY) / range) * h;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
