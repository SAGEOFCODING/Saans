'use client';

import React, { useState } from 'react';
import { InfoIcon, CloseIcon } from './Icons';

interface ModeBannerProps {
  mode?: 'rules' | 'gemini' | 'mock' | 'llm' | string | null;
  airSource?: 'live' | 'cache' | 'manual' | null;
  airAgeMin?: number;
}

export function ModeBanner({ mode, airSource, airAgeMin }: ModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isRules = mode === 'rules';
  const isCache = airSource === 'cache';
  const isManual = airSource === 'manual';

  if (!isRules && !isCache && !isManual) return null;

  return (
    <aside
      id="mode-banner"
      role="status"
      aria-label="System status alert"
      className="mb-4 flex items-center justify-between gap-3 rounded-control border border-line bg-surface/90 px-4 py-2.5 text-sm text-ink-muted backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <InfoIcon size={16} className="text-sky shrink-0" />
        <span>
          {isRules && 'Running in rules-only mode — all recommendations are computed deterministically.'}
          {isCache && !isRules && `Using cached air quality data (${airAgeMin ?? 15}m old). Live sensor stream refreshing.`}
          {isManual && !isRules && 'Using manual air quality estimate.'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded p-1 text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-sky"
        aria-label="Dismiss status notification"
      >
        <CloseIcon size={16} />
      </button>
    </aside>
  );
}
