'use client';

import { useEffect, useRef, useState } from 'react';
import type { Narration } from '../../hooks/useNarration';
import { EVENT_LABELS } from '../../hooks/useNarration';

// ─── Typewriter Effect ───────────────────────────────────────────────

function useTypewriter(text: string, speed = 20): string {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayed;
}

// ─── Relative Time ───────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Component ───────────────────────────────────────────────────────

export function NarrationPanel({
  narrations,
  loading,
}: {
  narrations: Narration[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const latest = narrations[0];
  const displayText = useTypewriter(latest?.explanation || '', 18);
  const [, forceUpdate] = useState(0);

  // Update relative timestamps every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-collapse after 20 seconds
  useEffect(() => {
    if (!latest) return;
    setExpanded(false); // Reset expansion on new narration
    // Could auto-hide here, but keeping visible since it's informative
  }, [latest?.id]);

  if (!latest && !loading) return null;

  const eventMeta = latest ? EVENT_LABELS[latest.eventType] : null;

  return (
    <div className="absolute bottom-16 left-4 z-40 max-w-md pointer-events-auto">
      {/* Active narration */}
      <div
        className="rounded-2xl backdrop-blur-xl bg-black/60 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500"
        style={{
          animation: latest ? 'fadeSlideIn 0.5s ease-out forwards' : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          {loading ? (
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: eventMeta?.color || '#4ade80',
                boxShadow: `0 0 8px ${eventMeta?.color || '#4ade80'}`,
              }}
            />
          )}
          <span
            className="text-[0.6rem] font-semibold uppercase tracking-widest"
            style={{ color: eventMeta?.color || '#94a3b8' }}
          >
            {loading ? 'Analyzing...' : eventMeta?.label || 'Narration'}
          </span>
          <span className="ml-auto text-[0.5rem] text-slate-600 font-mono">
            {latest ? relativeTime(latest.timestamp) : ''}
          </span>
          {narrations.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[0.5rem] text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              {expanded ? '▼' : `▲ ${narrations.length - 1} more`}
            </button>
          )}
        </div>

        {/* Body — typewriter text */}
        <div className="px-4 py-3">
          {loading && !latest ? (
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[0.6rem] text-slate-500 ml-1">Swarm is speaking...</span>
            </div>
          ) : (
            <p className="text-[0.7rem] leading-relaxed text-slate-300 font-light">
              {displayText}
              {displayText.length < (latest?.explanation?.length || 0) && (
                <span className="inline-block w-[2px] h-3 bg-cyan-400 ml-0.5 animate-pulse" />
              )}
            </p>
          )}
        </div>
      </div>

      {/* History (expanded) */}
      {expanded && narrations.length > 1 && (
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
          {narrations.slice(1).map((n) => {
            const meta = EVENT_LABELS[n.eventType];
            return (
              <div
                key={n.id}
                className="rounded-xl bg-black/40 backdrop-blur-md border border-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-[0.5rem] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="ml-auto text-[0.45rem] text-slate-600 font-mono">
                    {relativeTime(n.timestamp)}
                  </span>
                </div>
                <p className="text-[0.6rem] text-slate-400 leading-relaxed line-clamp-2">
                  {n.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS for fade-in animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
