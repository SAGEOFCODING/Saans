'use client';

import React, { useState } from 'react';
import type { ChosenAction } from '@/domain/types';
import { CheckIcon, ChevronDownIcon } from './Icons';

interface ActionItemProps {
  action: ChosenAction;
  onToggleDoing?: (actionId: string, doing: boolean) => void;
  isDoing?: boolean;
  lang?: 'en' | 'hi';
}

const COST_LABELS = {
  free: { en: 'Free', hi: 'निःशुल्क' },
  low: { en: '₹ Low', hi: '₹ कम खर्च' },
  mid: { en: '₹₹ Mid', hi: '₹₹ मध्यम' },
};

const EFFORT_LABELS = {
  1: { en: 'Easy', hi: 'सरल' },
  2: { en: 'Moderate', hi: 'मध्यम' },
  3: { en: 'High', hi: 'प्रयास' },
};

export function ActionItem({ action, onToggleDoing, isDoing = false, lang = 'en' }: ActionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isHi = lang === 'hi';

  const titleStr = typeof action.title === 'object'
    ? (isHi ? action.title.hi || action.title.en : action.title.en)
    : (action.title || action.id);

  const whyStr = typeof action.why === 'object'
    ? (isHi ? action.why.hi || action.why.en : action.why.en)
    : (action.why || '');

  const cost = action.cost ? COST_LABELS[action.cost][isHi ? 'hi' : 'en'] : null;
  const effort = action.effort ? EFFORT_LABELS[action.effort][isHi ? 'hi' : 'en'] : null;

  return (
    <article
      className={`action-card rounded-control border p-3.5 transition-all ${
        isDoing ? 'border-gain bg-gain/5' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {cost && (
              <span className="rounded-chip bg-haze px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                {cost}
              </span>
            )}
            {effort && (
              <span className="rounded-chip bg-haze px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                {effort}
              </span>
            )}
            {action.confidence && (
              <span className="rounded-chip bg-haze px-2 py-0.5 text-[11px] text-ink-muted">
                {isHi ? `अनुमान · ${action.confidence}` : `Est · ${action.confidence}`}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-ink leading-snug">{titleStr}</h4>
          {whyStr && <p className="mt-1 text-xs text-ink-muted leading-relaxed">{whyStr}</p>}
        </div>

        {onToggleDoing && (
          <button
            type="button"
            onClick={() => onToggleDoing(action.id, !isDoing)}
            aria-pressed={isDoing}
            className={`shrink-0 flex items-center gap-1 rounded-chip px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky ${
              isDoing
                ? 'bg-gain text-white shadow-sm'
                : 'border border-line bg-surface text-ink-muted hover:border-gain hover:text-gain'
            }`}
          >
            {isDoing ? <CheckIcon size={14} /> : null}
            <span>{isDoing ? (isHi ? 'कर रहे हैं' : 'Active') : (isHi ? 'शामिल करें' : 'Do this')}</span>
          </button>
        )}
      </div>

      {action.impact?.exposureDeltaPct && (
        <div className="mt-2.5 flex items-center justify-between border-t border-line/40 pt-2 text-xs">
          <span className="font-semibold text-gain">
            ↓ {Math.abs(action.impact.exposureDeltaPct)}% {isHi ? 'प्रदूषक जोखिम कटौती' : 'exposure reduction'}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-ink-muted hover:text-ink text-[11px]"
            aria-expanded={expanded}
          >
            <span>{isHi ? 'विवरण' : 'Details'}</span>
            <ChevronDownIcon size={14} className={expanded ? 'rotate-180' : ''} />
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-2 rounded bg-haze/70 p-2.5 text-xs text-ink-muted">
          <p>{isHi ? 'यह क्रिया दैनिक कार्यक्रम के दौरान आपके वायुमार्ग में जाने वाले महीन कणों को घटाती है।' : 'Action applies environmental filtration or timing shifts during this schedule block.'}</p>
        </div>
      )}
    </article>
  );
}
