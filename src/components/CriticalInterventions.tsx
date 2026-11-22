'use client';

import React, { useState } from 'react';

interface CriticalInterventionsProps {
  onToggleAction?: (actionId: string, active: boolean) => void;
  lang?: 'en' | 'hi';
}

interface Intervention {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  deltaPct: number;
  completed: boolean;
  hasHepaToggle?: boolean;
}

export function CriticalInterventions({ onToggleAction, lang = 'en' }: CriticalInterventionsProps) {
  const isHi = lang === 'hi';

  const [items, setItems] = useState<Intervention[]>([
    {
      id: 'morning-walk-shift',
      titleEn: 'Morning Walk → Indoor Stretch',
      titleHi: 'सुबह की सैर → इनडोर स्ट्रेचिंग व योग',
      subtitleEn: 'Completed at 7:15 AM',
      subtitleHi: 'प्रातः 7:15 बजे संपन्न',
      deltaPct: 24,
      completed: true,
    },
    {
      id: 'bedroom-purifier-night',
      titleEn: 'Seal Bedroom & Run Purifier',
      titleHi: 'कमरे को सील करें व एयर प्यूरीफायर चलाएं',
      subtitleEn: 'Living Room HEPA',
      subtitleHi: 'लिविंग रूम HEPA फ़िल्टर',
      deltaPct: 32,
      completed: false,
      hasHepaToggle: true,
    },
    {
      id: 'n95-mask-commute',
      titleEn: 'Equip N95 for School Drop',
      titleHi: 'स्कूल ड्रॉप के लिए N95 मास्क पहनाएं',
      subtitleEn: "In-hand (Kid's Small) • Effort: 3 mins",
      subtitleHi: 'छोटा आकार • केवल 3 मिनट का समय',
      deltaPct: 18,
      completed: false,
    },
  ]);

  const [hepaMode, setHepaMode] = useState<'Silent' | 'Auto Turbo'>('Auto Turbo');

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.completed;
          if (onToggleAction) onToggleAction(id, nextState);
          return { ...item, completed: nextState };
        }
        return item;
      })
    );
  };

  const pendingCount = items.filter((i) => !i.completed).length;

  return (
    <section
      id="family-interventions"
      aria-label={isHi ? 'महत्वपूर्ण पारिवारिक सुरक्षा कार्य' : 'Critical Family Interventions'}
      className="rounded-xl bg-surface/90 backdrop-blur-md border border-line/30 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4 transition-all"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line/20 pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm sm:text-base font-bold text-on-surface font-display tracking-tight">
            {isHi ? 'महत्वपूर्ण पारिवारिक सुरक्षा कार्य' : 'Critical Family Interventions'}
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            {isHi ? 'शिशुओं व स्कूली बच्चों की सुरक्षा के अनुकूल' : 'Calibrated for toddler & school-goer safety'}
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 text-[11px] font-bold">
          {isHi
            ? `${items.length} में से ${pendingCount} शेष`
            : `${pendingCount} of ${items.length} Pending`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border p-3.5 flex items-start gap-3 transition-all ${
              item.completed
                ? 'bg-surface-container-low/70 border-line/30'
                : 'bg-surface border-line/40 shadow-xs'
            }`}
          >
            {/* Interactive Checkbox */}
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-label={`Toggle ${isHi ? item.titleHi : item.titleEn}`}
              className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                item.completed
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container border border-line/60 hover:bg-primary/20 text-transparent'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            {/* Content Body */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                    item.completed
                      ? 'line-through text-on-surface-variant/70'
                      : 'text-on-surface'
                  }`}
                >
                  {isHi ? item.titleHi : item.titleEn}
                </span>
                <span className="shrink-0 px-2 py-0.5 rounded-chip bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
                  ↓ {item.deltaPct}% {isHi ? 'कमी' : 'exp'}
                </span>
              </div>

              {/* Hepa Toggle Sub-Widget */}
              {item.hasHepaToggle ? (
                <div className="flex items-center justify-between gap-2 bg-surface-container-low/80 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-[11px] text-on-surface-variant font-medium truncate">
                    {isHi ? item.subtitleHi : item.subtitleEn}
                  </span>
                  <div className="inline-flex rounded-lg bg-surface-container p-0.5 shrink-0 border border-line/30 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setHepaMode('Silent')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        hepaMode === 'Silent'
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-ink'
                      }`}
                    >
                      {isHi ? 'शांत (Silent)' : 'Silent'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHepaMode('Auto Turbo')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        hepaMode === 'Auto Turbo'
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-ink'
                      }`}
                    >
                      {isHi ? 'ऑटो टर्बो' : 'Auto Turbo'}
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-on-surface-variant">
                  {isHi ? item.subtitleHi : item.subtitleEn}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
