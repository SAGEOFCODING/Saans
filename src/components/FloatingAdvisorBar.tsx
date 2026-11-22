'use client';

import React, { useState } from 'react';

interface FloatingAdvisorBarProps {
  onOpenChat: (initialQuery?: string) => void;
  lang?: 'en' | 'hi';
}

export function FloatingAdvisorBar({ onOpenChat, lang = 'en' }: FloatingAdvisorBarProps) {
  const isHi = lang === 'hi';
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim() || (isHi ? 'क्या शाम को बाहर जाना सुरक्षित है?' : 'Is it safe to step out this evening?');
    onOpenChat(clean);
    setQuery('');
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto bg-surface/95 backdrop-blur-md border border-line/50 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 transition-all hover:border-primary/40">
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isHi
                ? 'स्वच्छ वायु सलाहकार से पूछें: मास्क, स्कूल रन या प्यूरीफायर शेड्यूल...'
                : 'Ask Clean-Air Advisor about school runs, masks, or purifier schedules...'
            }
            className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>{isHi ? 'पारिवारिक जोखिम -32%' : 'Family Exposure -32%'}</span>
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
          >
            {isHi ? 'पूछें' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
}
