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
      className="rounded-panel border border-line bg-surface p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink">
            {isHi ? 'क्या-अगर? इंटरएक्टिव सिम्युलेटर' : 'What-If? Intervention Simulator'}
          </h3>
          <p className="text-xs text-ink-muted">
            {isHi ? 'उपाय जोड़ें और तुरंत बदलाव देखें' : 'Toggle actions to see instant exposure delta (<1ms)'}
          </p>
        </div>
        <span className="rounded-chip bg-gain/10 border border-gain/30 px-2 py-0.5 text-xs font-bold text-gain">
          ↓ {deltaPct}%
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {INTERVENTIONS.map((item) => {
          const active = activeActionIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex items-start justify-between gap-3 p-2 rounded-control border cursor-pointer transition-colors ${
                active ? 'border-sky bg-sky/5' : 'border-line/70 hover:bg-haze/50'
              }`}
            >
              <div className="flex-1">
                <span className="font-semibold text-ink block">{item.title[isHi ? 'hi' : 'en']}</span>
                <span className="text-[11px] text-ink-muted block">{item.detail[isHi ? 'hi' : 'en']}</span>
              </div>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onToggleAction(item.id, e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-sky focus:ring-sky cursor-pointer"
                aria-label={item.title[isHi ? 'hi' : 'en']}
              />
            </label>
          );
        })}
      </div>

      <div aria-live="polite" className="sr-only">
        {isHi
          ? `अद्यतन अनुमानित प्रदूषक जोखिम: ${deltaPct}% की कमी`
          : `Updated estimated exposure reduction: ${deltaPct}% lower`}
      </div>
    </section>
  );
}
