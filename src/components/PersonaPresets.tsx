'use client';

import React from 'react';
import presetsData from '@/data/presets.json';
import type { Household } from '@/domain/types';

export type PresetKey = 'priya' | 'mehta' | 'rohan' | 'anil';

interface PersonaPresetsProps {
  onSelectPreset: (household: Household, name: string) => void;
  lang?: 'en' | 'hi';
}

const PRESET_LABELS: Record<PresetKey, { en: string; hi: string; subtitleEn: string; subtitleHi: string; initial: string }> = {
  priya: {
    en: 'Priya',
    hi: 'प्रिया',
    subtitleEn: 'Family with infant (car commute)',
    subtitleHi: 'शिशु और बुजुर्ग वाला परिवार',
    initial: 'P',
  },
  mehta: {
    en: 'Mr. Mehta',
    hi: 'मिस्टर मेहता',
    subtitleEn: 'Senior walker with asthma',
    subtitleHi: 'वरिष्ठ नागरिक, दमा पीड़ित',
    initial: 'M',
  },
  rohan: {
    en: 'Rohan',
    hi: 'रोहन',
    subtitleEn: 'Student commuter on bike',
    subtitleHi: 'बाइक पर छात्र, सीमित बजट',
    initial: 'R',
  },
  anil: {
    en: 'Anil',
    hi: 'अनिल',
    subtitleEn: 'RWA Lead (120 apartments)',
    subtitleHi: 'आरडब्ल्यूए सचिव (120 फ्लैट)',
    initial: 'A',
  },
};

export function PersonaPresets({ onSelectPreset, lang = 'en' }: PersonaPresetsProps) {
  const [selectedPresetKey, setSelectedPresetKey] = React.useState<PresetKey | null>(null);
  const isHi = lang === 'hi';

  const handleClick = (key: PresetKey) => {
    const raw = (presetsData as Record<string, { name: string; household: Household }>)[key];
    if (raw?.household) {
      setSelectedPresetKey(key);
      onSelectPreset(raw.household, raw.name);
    }
  };

  return (
    <div className="my-5">
      <div aria-live="polite" className="sr-only">
        {selectedPresetKey &&
          (isHi
            ? `चुना गया प्रोफाइल: ${PRESET_LABELS[selectedPresetKey].hi}`
            : `Switched to preset: ${PRESET_LABELS[selectedPresetKey].en}`)}
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {isHi ? 'त्वरित प्रोफाइल चुनें:' : 'Quick Household Presets:'}
        </p>
        <span className="text-[11px] text-ink-muted/80">
          {isHi ? '1-क्लिक में फॉर्म भरें' : '1-click to simulate persona'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['priya', 'mehta', 'rohan', 'anil'] as PresetKey[]).map((key) => {
          const item = PRESET_LABELS[key];
          const isSelected = selectedPresetKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              className={`group flex items-start gap-3 rounded-panel border p-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                isSelected
                  ? 'border-sky bg-sky/5 shadow-xs ring-1.5 ring-sky/40'
                  : 'border-line/30 bg-surface/90 hover:border-sky/40 hover:bg-surface hover:shadow-xs'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  isSelected ? 'bg-sky text-on-sky shadow-xs scale-105' : 'bg-haze text-ink group-hover:bg-sky/15 group-hover:text-sky-deep'
                }`}
                aria-hidden="true"
              >
                {item.initial}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ink block leading-snug truncate">
                  {isHi ? item.hi : item.en}
                </span>
                <span className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 leading-tight">
                  {isHi ? item.subtitleHi : item.subtitleEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
