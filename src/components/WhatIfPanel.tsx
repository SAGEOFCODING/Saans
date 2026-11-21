'use client';

import React from 'react';

interface WhatIfPanelProps {
  activeActionIds: string[];
  onToggleAction: (actionId: string, active: boolean) => void;
  deltaPct: number;
  lang?: 'en' | 'hi';
}

const INTERVENTIONS = [
  {
    id: 'bedroom-purifier-night',
    title: { en: 'Bedroom HEPA Purifier (Night)', hi: 'बेडरूम HEPA प्यूरीफायर (रात)' },
    detail: { en: 'Cuts overnight infiltration by 50%', hi: 'रात में प्रदूषण रिसने में 50% कटौती' },
  },
  {
    id: 'n95-mask-commute',
    title: { en: 'Fitted N95 Respirator (Commute)', hi: 'फिटेड N95 मास्क (सफर)' },
    detail: { en: 'Filters 75-95% of transit particles', hi: 'सफर के 75-95% कणों को रोकता है' },
  },
  {
    id: 'metro-commute-swap',
    title: { en: 'Metro / Filtered Transit Swap', hi: 'मेट्रो रेल से आवागमन' },
    detail: { en: 'Avoids direct roadside tailpipe plume', hi: 'सड़क के सीधे धुएं से बचाव' },
  },
  {
    id: 'kitchen-exhaust-cooking',
    title: { en: 'Kitchen Exhaust ON during Cooking', hi: 'खाना बनाते समय एग्जॉस्ट फैन' },
    detail: { en: 'Vents combustion NO2 and ultrafine PM', hi: 'रसोई का धुआं बाहर निकालता है' },
  },
  {
    id: 'seal-window-drafts',
    title: { en: 'Weatherstrip Leaky Windows', hi: 'खिड़की की दरारें सील करें' },
    detail: { en: 'Reduces ambient smog infiltration', hi: 'कमरे में बाहरी स्मॉग का प्रवेश घटाए' },
  },
  {
    id: 'shift-walk-afternoon',
    title: { en: 'Shift Outdoor Walk to Afternoon', hi: 'टहलने का समय दोपहर में करें' },
    detail: { en: 'Avoids high morning thermal inversion', hi: 'सुबह के भारी स्मॉग पीक से बचाव' },
  },
];

export function WhatIfPanel({
  activeActionIds,
  onToggleAction,
  deltaPct,
  lang = 'en',
}: WhatIfPanelProps) {
  const isHi = lang === 'hi';

  return (
    <section
      id="whatif-sliders"
      aria-label="What-If Intervention Simulator"
      className="rounded-panel border border-line/70 bg-surface/95 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5 transition-all"
    >
      <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight">
            {isHi ? 'क्या-अगर? इंटरएक्टिव सिम्युलेटर' : 'What-If? Intervention Simulator'}
          </h3>
          <p className="text-[11px] text-ink-muted">
            {isHi ? 'उपाय जोड़ें और तुरंत बदलाव देखें' : 'Toggle actions to see instant exposure delta (<1ms)'}
          </p>
        </div>
        <span className="rounded-chip bg-gain/10 border border-gain/30 px-2.5 py-0.5 text-xs font-bold text-gain shadow-xs">
          ↓ {deltaPct}%
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {INTERVENTIONS.map((item) => {
          const active = activeActionIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex items-center justify-between gap-3 p-2.5 rounded-control border cursor-pointer transition-all duration-150 ${
                active
                  ? 'border-sky/60 bg-sky/5 shadow-xs'
                  : 'border-line/60 hover:border-line hover:bg-haze/40'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <span className="font-semibold text-ink block text-xs leading-snug">{item.title[isHi ? 'hi' : 'en']}</span>
                <span className="text-[11px] text-ink-muted block mt-0.5 truncate">{item.detail[isHi ? 'hi' : 'en']}</span>
              </div>
              <div className="relative inline-flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => onToggleAction(item.id, e.target.checked)}
                  className="sr-only"
                  aria-label={item.title[isHi ? 'hi' : 'en']}
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                    active ? 'bg-sky' : 'bg-line/80'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out mt-0.75 ml-0.75 ${
                      active ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div aria-live="polite" className="sr-only">
        {isHi
          ? `इंटरएक्टिव सिम्युलेटर अद्यतित: कुल प्रदूषक जोखिम ${deltaPct}% कम हुआ।`
          : `Simulator updated: total exposure reduced by ${deltaPct}%.`}
      </div>
    </section>
  );
}
