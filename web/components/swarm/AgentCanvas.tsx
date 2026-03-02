'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WebGLRenderer } from '../../lib/webgl-renderer';
import { Canvas2DRenderer } from '../../lib/canvas2d-renderer';
import type { ISwarmRenderer } from '../../lib/types';
import type { Tool } from '../../lib/types';
import type { EngineHandle } from '../../hooks/useWasmEngine';

const CANVAS2D_THRESHOLD = 50_000;

export interface AgentCanvasRef {
  renderer: ISwarmRenderer | null;
}

interface AgentCanvasProps {
  getHandle: () => EngineHandle | null;
  activeTool: Tool;
  agentCount: number;
  onRendererReady: (renderer: ISwarmRenderer) => void;
}

/** Full-screen canvas for agent rendering + click interaction. Auto-selects Canvas2D or WebGL. */
export const AgentCanvas = forwardRef<AgentCanvasRef, AgentCanvasProps>(function AgentCanvas(
  { getHandle, activeTool, agentCount, onRendererReady },
  ref,
) {
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ISwarmRenderer | null>(null);
  const rendererTypeRef = useRef<'canvas2d' | 'webgl' | null>(null);
  const shockwaveRef = useRef<{ x: number; y: number; t: number; opacity: number }[]>([]);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    get renderer() { return rendererRef.current; },
  }), []);

  // Create / swap renderer based on agent count
  useEffect(() => {
    const useCanvas2D = agentCount <= CANVAS2D_THRESHOLD;
    const targetType = useCanvas2D ? 'canvas2d' : 'webgl';

    // Already have the right renderer type
    if (rendererTypeRef.current === targetType && rendererRef.current) return;

    // Destroy old renderer
    rendererRef.current?.destroy();
    rendererRef.current = null;
    rendererTypeRef.current = null;

    try {
      if (useCanvas2D) {
        const canvas = canvas2dRef.current;
        if (!canvas) return;
        const renderer = new Canvas2DRenderer(canvas, agentCount);
        rendererRef.current = renderer;
        rendererTypeRef.current = 'canvas2d';
        renderer.resize();
        onRendererReady(renderer);
      } else {
        const canvas = webglCanvasRef.current;
        if (!canvas) return;
        const renderer = new WebGLRenderer(canvas, agentCount);
        rendererRef.current = renderer;
        rendererTypeRef.current = 'webgl';
        renderer.resize();
        onRendererReady(renderer);
      }
    } catch (err) {
      console.error('Renderer init failed:', err);
    }

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererTypeRef.current = null;
    };
  }, [agentCount, onRendererReady]);

  // Resize handler
  useEffect(() => {
    const resize = () => rendererRef.current?.resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Shockwave animation overlay
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    let raf = 0;

    function draw() {
      const ctx = overlay!.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      overlay!.width = overlay!.clientWidth * dpr;
      overlay!.height = overlay!.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, overlay!.clientWidth, overlay!.clientHeight);

      const now = performance.now();
      const waves = shockwaveRef.current;
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        const elapsed = (now - w.t) / 1000;
        if (elapsed > 0.8) {
          waves.splice(i, 1);
          continue;
        }
        const radius = elapsed * 200;
        const opacity = (1 - elapsed / 0.8) * 0.6;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2 - elapsed * 2;
        ctx.beginPath();
        ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (waves.length > 0) {
        raf = requestAnimationFrame(draw);
      }
    }

    const interval = setInterval(() => {
      if (shockwaveRef.current.length > 0 && !raf) {
        raf = requestAnimationFrame(draw);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const handle = getHandle();
    if (!handle) return;

    // Use whichever canvas is active for coordinate mapping
    const activeCanvas = (agentCount <= CANVAS2D_THRESHOLD)
      ? canvas2dRef.current
      : webglCanvasRef.current;
    if (!activeCanvas) return;

    const rect = activeCanvas.getBoundingClientRect();
    const w = activeCanvas.clientWidth;
    const h = activeCanvas.clientHeight;
    const { engine, worldSize } = handle;
    const mapSize = Math.min(w, h) * 0.92;
    const oX = (w - mapSize) / 2;
    const oY = (h - mapSize) / 2;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = ((screenX - oX) / mapSize) * worldSize;
    const worldY = ((screenY - oY) / mapSize) * worldSize;

    if (worldX < 0 || worldX > worldSize || worldY < 0 || worldY > worldSize) return;

    switch (activeTool) {
      case 'shock':
        engine.inject_surprise(worldX, worldY, 60, 0.8);
        shockwaveRef.current.push({ x: screenX, y: screenY, t: performance.now(), opacity: 1 });
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          const ctx = overlay.getContext('2d');
          if (ctx) {
            requestAnimationFrame(function draw() {
              const dpr = window.devicePixelRatio || 1;
              overlay.width = overlay.clientWidth * dpr;
              overlay.height = overlay.clientHeight * dpr;
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              ctx.clearRect(0, 0, overlay.clientWidth, overlay.clientHeight);
              const now = performance.now();
              const waves = shockwaveRef.current;
              for (let i = waves.length - 1; i >= 0; i--) {
                const w = waves[i];
                const elapsed = (now - w.t) / 1000;
                if (elapsed > 0.8) { waves.splice(i, 1); continue; }
                const radius = elapsed * 200;
                const op = (1 - elapsed / 0.8) * 0.6;
                ctx.strokeStyle = `rgba(255, 255, 255, ${op})`;
                ctx.lineWidth = Math.max(0.5, 2 - elapsed * 2);
                ctx.beginPath();
                ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);
                ctx.stroke();
              }
              if (waves.length > 0) requestAnimationFrame(draw);
            });
          }
        }
        break;
      case 'danger':
        engine.deposit_pheromone(worldX, worldY, 1, 5.0);
        break;
      case 'novelty':
        engine.deposit_pheromone(worldX, worldY, 4, 5.0);
        break;
      case 'trail':
        engine.deposit_pheromone(worldX, worldY, 2, 5.0);
        break;
    }
  }, [activeTool, getHandle, agentCount]);

  const useCanvas2D = agentCount <= CANVAS2D_THRESHOLD;

  return (
    <div className="absolute inset-0" onClick={handleClick} style={{ cursor: 'crosshair' }}>
      {/* Canvas2D canvas — visible when ≤50K agents */}
      <canvas
        ref={canvas2dRef}
        className="block w-full h-full"
        style={{ display: useCanvas2D ? 'block' : 'none' }}
      />
      {/* WebGL canvas — visible when >50K agents */}
      <canvas
        ref={webglCanvasRef}
        className="block w-full h-full absolute inset-0"
        style={{ display: useCanvas2D ? 'none' : 'block' }}
      />
      {/* Shockwave overlay */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
      />
    </div>
  );
});
