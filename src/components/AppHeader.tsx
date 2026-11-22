'use client';

import React from 'react';
import type { Location } from '@/domain/types';

interface AppHeaderProps {
  location: Location;
  onChangeLocationClick?: () => void;
  lang: 'en' | 'hi';
  onLangChange: (lang: 'en' | 'hi') => void;
  onOpenChat: (initialQuery?: string) => void;
  onOpenPresets?: () => void;
}

export function AppHeader({
  location,
  onChangeLocationClick,
  lang,
  onLangChange,
  onOpenChat,
  onOpenPresets,
}: AppHeaderProps) {
  const isHi = lang === 'hi';

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-line/30 transition-all">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Location */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#" className="flex items-center gap-2 group">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-primary font-display group-hover:opacity-90 transition-opacity">
              Saans
            </span>
            <span className="text-sm font-medium text-ink-muted">साँस</span>
          </a>

          {/* Location Chip */}
          <button
            type="button"
            onClick={onChangeLocationClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-line/40 text-ink-muted hover:text-ink hover:bg-surface-container transition-colors text-xs font-medium cursor-pointer"
            title={isHi ? 'स्थान बदलें' : 'Click to change or refresh location'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate max-w-[180px] sm:max-w-[240px]">
              {location.name || 'New Delhi, Delhi NCR'} ({isHi ? 'स्वतः-पहचाना' : 'Auto-detected'})
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted hover:rotate-180 transition-transform">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>

        {/* Center Nav Anchors */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => scrollToSection('air-hero')}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-bold transition-colors"
          >
            {isHi ? 'वायु स्थिति' : 'Air Hero'}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('forecast-curve')}
            className="px-3 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-container-low transition-colors"
          >
            {isHi ? 'पूर्वानुमान' : 'Forecast'}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('family-interventions')}
            className="px-3 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-container-low transition-colors"
          >
            {isHi ? 'पारिवारिक सुरक्षा' : 'Shield'}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('indoor-sanctuary')}
            className="px-3 py-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-container-low transition-colors"
          >
            {isHi ? 'इनडोर शेल्टर' : 'Indoor'}
          </button>
        </nav>

        {/* Right Actions: Lang Switcher + Profile / Chat */}
        <div className="flex items-center gap-2.5">
          {/* Bilingual Toggle */}
          <button
            type="button"
            onClick={() => onLangChange(lang === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1.5 rounded-lg border border-line/40 bg-surface text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-container-low transition-colors shadow-xs"
            aria-label="Toggle language between English and Hindi"
          >
            {lang === 'en' ? 'EN | हि' : 'हि | EN'}
          </button>

          {/* Presets / Persona Switcher */}
          {onOpenPresets && (
            <button
              type="button"
              onClick={onOpenPresets}
              className="h-8 w-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors shadow-xs"
              title={isHi ? 'पारिवारिक प्रोफाइल चुनें' : 'Switch family persona'}
              aria-label="Switch persona"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          )}

          {/* Ask Advisor Button */}
          <button
            type="button"
            onClick={() => onOpenChat()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            <span>{isHi ? 'सलाहकार' : 'Advisor'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
