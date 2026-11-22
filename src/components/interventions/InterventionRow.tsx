'use client';

import React, { useState } from 'react';
import type { Intervention } from './types';

interface InterventionRowProps {
  item: Intervention;
  isHi: boolean;
  onToggle: (id: string) => void;
}

export function InterventionRow({ item, isHi, onToggle }: InterventionRowProps) {
  const [hepaMode, setHepaMode] = useState<'Silent' | 'Auto Turbo'>('Auto Turbo');

  return (
    <div
      className={`rounded-lg border p-3.5 flex items-start gap-3 transition-all ${
        item.completed
          ? 'bg-surface-container-low/70 border-line/30'
          : 'bg-surface border-line/40 shadow-xs'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={`Toggle ${isHi ? item.titleHi : item.titleEn}`}
        className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          item.completed
            ? 'bg-primary text-on-primary shadow-xs'
            : 'bg-surface-container border border-line/60 hover:bg-primary/20 text-transparent'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
              item.completed ? 'line-through text-on-surface-variant/70' : 'text-on-surface'
            }`}
          >
            {isHi ? item.titleHi : item.titleEn}
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-chip bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
            ↓ {item.deltaPct}% {isHi ? 'कमी' : 'exp'}
          </span>
        </div>

        {item.hasHepaToggle ? (
          <div className="flex items-center justify-between gap-2 bg-surface-container-low/80 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-[11px] text-on-surface-variant font-medium truncate">
              {isHi ? item.subtitleHi : item.subtitleEn}
            </span>
            <div className="inline-flex rounded-lg bg-surface-container p-0.5 shrink-0 border border-line/30 text-[10px]">
              <button
                type="button"
                onClick={() => setHepaMode('Silent')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                  hepaMode === 'Silent' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-ink'
                }`}
              >
                {isHi ? 'शांत (Silent)' : 'Silent'}
              </button>
              <button
                type="button"
                onClick={() => setHepaMode('Auto Turbo')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                  hepaMode === 'Auto Turbo' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-ink'
                }`}
              >
                {isHi ? 'ऑटो टर्बो' : 'Auto Turbo'}
              </button>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-on-surface-variant">
            {isHi ? item.subtitleHi : item.subtitleEn}
          </span>
        )}
      </div>
    </div>
  );
}
