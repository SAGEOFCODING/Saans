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
      className="inline-flex rounded-control border border-line bg-surface p-0.5 shadow-sm"
    >
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`px-3 py-1 text-sm font-semibold rounded-control transition-colors ${
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
        className={`px-3 py-1 text-sm font-semibold rounded-control transition-colors ${
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
