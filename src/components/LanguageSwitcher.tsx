'use client';

import React from 'react';
import { saveSessionItem } from '@/lib/storage';

interface LanguageSwitcherProps {
  currentLang: 'en' | 'hi';
  onLangChange: (lang: 'en' | 'hi') => void;
}

export function LanguageSwitcher({ currentLang, onLangChange }: LanguageSwitcherProps) {
  const handleToggle = (lang: 'en' | 'hi') => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    saveSessionItem('saans_lang', lang);
    onLangChange(lang);
  };

  return (
    <div
      id="language-switcher"
      role="group"
      aria-label="Language selection"
      className="inline-flex rounded-chip border border-line bg-surface/90 p-0.5 shadow-sm text-xs"
    >
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-all ${
          currentLang === 'en'
            ? 'bg-sky text-on-sky shadow-sm'
            : 'text-ink-muted hover:text-ink'
        }`}
        aria-pressed={currentLang === 'en'}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleToggle('hi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-chip transition-all ${
          currentLang === 'hi'
            ? 'bg-sky text-on-sky shadow-sm'
            : 'text-ink-muted hover:text-ink'
        }`}
        aria-pressed={currentLang === 'hi'}
      >
        हिंदी
      </button>
    </div>
  );
}
