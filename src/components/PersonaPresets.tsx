'use client';

import React from 'react';
import presetsData from '@/data/presets.json';
import type { Household } from '@/domain/types';

export type PresetKey = 'priya' | 'mehta' | 'rohan' | 'anil';

interface PersonaPresetsProps {
  onSelectPreset: (household: Household, name: string) => void;
  lang?: 'en' | 'hi';
}

const PRESET_LABELS: Record<PresetKey, { en: string; hi: string; subtitleEn: string; subtitleHi: string }> = {
  priya: {
    en: 'Priya',
    hi: 'प्रिया',
    subtitleEn: 'Family with infant (car commute)',
    subtitleHi: 'शिशु और बुजुर्ग वाला परिवार',
  },
  mehta: {
    en: 'Mr. Mehta',
    hi: 'मिस्टर मेहता',
    subtitleEn: 'Senior walker with asthma',
    subtitleHi: 'वरिष्ठ नागरिक, दमा पीड़ित',
  },
  rohan: {
    en: 'Rohan',
    hi: 'रोहन',
    subtitleEn: 'Student commuter on bike',
    subtitleHi: 'बाइक पर छात्र, सीमित बजट',
  },
  anil: {
    en: 'Anil',
    hi: 'अनिल',
    subtitleEn: 'RWA Lead (120 apartments)',
    subtitleHi: 'आरडब्ल्यूए सचिव (120 फ्लैट)',
  },
};

export function PersonaPresets({ onSelectPreset, lang = 'en' }: PersonaPresetsProps) {
  const isHi = lang === 'hi';

  const handleClick = (key: PresetKey) => {
    const raw = (presetsData as Record<string, { name: string; household: Household }>)[key];
    if (raw?.household) {
      onSelectPreset(raw.household, raw.name);
    }
  };

  return (
    <div className="my-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {isHi ? 'त्वरित प्रोफाइल चुनें:' : 'Quick Household Presets:'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['priya', 'mehta', 'rohan', 'anil'] as PresetKey[]).map((key) => {
          const item = PRESET_LABELS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              className="flex flex-col items-start rounded-control border border-line bg-surface p-2.5 text-left transition-all hover:border-sky hover:bg-sky/5 focus:outline-none focus:ring-2 focus:ring-sky"
            >
              <span className="text-sm font-bold text-ink">{isHi ? item.hi : item.en}</span>
              <span className="text-xs text-ink-muted line-clamp-1">
                {isHi ? item.subtitleHi : item.subtitleEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
