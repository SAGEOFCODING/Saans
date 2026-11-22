'use client';

import React, { useState } from 'react';
import type { Span } from '@/domain/types';

interface CleanWindowBannerProps {
  bestWindow?: Span;
  lang?: 'en' | 'hi';
}

export function CleanWindowBanner({ bestWindow, lang = 'en' }: CleanWindowBannerProps) {
  const isHi = lang === 'hi';
  const [reminded, setReminded] = useState(false);

  const windowText = bestWindow
    ? `${bestWindow.start} – ${bestWindow.end}`
    : '1:30 PM – 4:00 PM';

  return (
    <section
      aria-label={isHi ? 'सबसे स्वच्छ वायु विंडो' : 'Cleanest Air Window'}
      className="rounded-xl bg-primary/10 border border-primary/25 backdrop-blur-md p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-on-surface font-display tracking-tight">
            ★ {isHi ? 'स्वच्छ वायु विंडो:' : 'Cleanest Air Window:'} {windowText}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isHi
              ? 'बच्चों के कमरों में ताजी हवा लाने, बाहर के जरूरी काम निपटाने और HEPA वेंटिलेशन का सबसे सुरक्षित समय।'
              : 'Safest time to air out children’s rooms, run outdoor errands, and ventilate with HEPA booster.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setReminded((prev) => !prev)}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer ${
          reminded
            ? 'bg-secondary text-on-secondary ring-2 ring-secondary/30'
            : 'bg-primary text-on-primary hover:bg-primary-container'
        }`}
        aria-pressed={reminded}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span>
          {reminded
            ? (isHi ? 'रिमाइंडर सेट ✓' : 'Reminder Set ✓')
            : (isHi ? 'याद दिलाएं' : 'Remind')}
        </span>
      </button>
    </section>
  );
}
