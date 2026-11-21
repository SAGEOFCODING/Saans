'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const stored = localStorage.getItem('saans_theme');
      const active = stored ? stored === 'dark' : prefersDark;
      setIsDark(active);
      document.documentElement.classList.toggle('dark', active);
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('saans_theme', next ? 'dark' : 'light');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 px-2.5 rounded-chip border border-line bg-surface hover:bg-haze text-xs font-semibold text-ink transition-colors flex items-center gap-1"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
