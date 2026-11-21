'use client';

import { Lang } from '@/lib/i18n';

export interface LanguageToggleProps {
  currentLang: Lang;
  onLanguageChange: (lang: Lang) => void;
}

export function LanguageToggle({ currentLang, onLanguageChange }: LanguageToggleProps) {
  const toggle = () => {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
    onLanguageChange(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="px-3 py-1.5 rounded-chip border border-line bg-surface hover:bg-haze text-xs font-semibold text-ink transition-colors flex items-center gap-1.5"
      aria-label={`Switch language to ${currentLang === 'en' ? 'Hindi' : 'English'}`}
    >
      <span aria-hidden="true">🌐</span>
      <span>{currentLang === 'en' ? 'हिन्दी' : 'English'}</span>
    </button>
  );
}
