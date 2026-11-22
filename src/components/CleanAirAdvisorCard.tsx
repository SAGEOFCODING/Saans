'use client';

import React, { useState } from 'react';

interface CleanAirAdvisorCardProps {
  onAsk: (query: string) => void;
  lang?: 'en' | 'hi';
}

export function CleanAirAdvisorCard({ onAsk, lang = 'en' }: CleanAirAdvisorCardProps) {
  const isHi = lang === 'hi';
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim() || (isHi ? 'क्या शाम 4 बजे बच्चों का बाहर खेलना सुरक्षित है?' : 'Is it safe for Priya to play outside at 4 PM?');
    onAsk(clean);
    setQuery('');
  };

  return (
    <section
      aria-label={isHi ? 'स्वच्छ वायु सलाहकार' : 'Clean-Air Advisor'}
      className="rounded-xl bg-surface/90 backdrop-blur-md border border-line/30 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3.5 transition-all"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          </span>
          <h3 className="text-sm sm:text-base font-bold text-on-surface font-display">
            {isHi ? 'स्वच्छ वायु सलाहकार' : 'Clean-Air Advisor'}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span>{isHi ? 'जोखिम में -32% कमी' : 'Exposure -32%'}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1.5 pl-3 border border-line/30 focus-within:border-primary transition-colors">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isHi
              ? 'उदा. क्या शाम 4 बजे बच्चों का बाहर खेलना सुरक्षित है?'
              : 'e.g., Is it safe for Priya to play outside at 4 PM?'
          }
          className="w-full bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 px-3.5 py-1.5 rounded-md bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
        >
          {isHi ? 'पूछें' : 'Ask'}
        </button>
      </form>
    </section>
  );
}
