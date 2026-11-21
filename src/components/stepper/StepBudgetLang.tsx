'use client';

import React from 'react';
import type { Household } from '@/domain/types';

interface StepBudgetLangProps {
  budget: Household['budget'];
  langPref: Household['lang'];
  onChange: (patch: { budget?: Household['budget']; lang?: Household['lang'] }) => void;
  lang?: 'en' | 'hi';
}

export function StepBudgetLang({ budget, langPref, onChange, lang = 'en' }: StepBudgetLangProps) {
  const isHi = lang === 'hi';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div>
        <label htmlFor="budget-tier" className="block font-semibold text-ink mb-1">
          {isHi ? 'मासिक बजट दायरा' : 'Action Budget Preference'}
        </label>
        <select
          id="budget-tier"
          value={budget}
          onChange={(e) => onChange({ budget: e.target.value as Household['budget'] })}
          className="w-full rounded-control border border-line bg-surface p-2 text-ink font-medium"
        >
          <option value="free">{isHi ? 'निःशुल्क (₹0 केवल आदतें/DIY)' : 'Free (₹0 habits & DIY only)'}</option>
          <option value="low">{isHi ? 'कम खर्च (<₹2,000 N95, DIY फिल्टर)' : 'Low Cost (<₹2,000 N95, DIY filter)'}</option>
          <option value="mid">{isHi ? 'लचीला (प्यूरीफायर / गैजेट्स)' : 'Flexible (Purifiers & swaps)'}</option>
        </select>
        <p className="mt-1 text-[11px] text-ink-muted">
          {isHi
            ? 'निःशुल्क चुनने पर कोई खरीददारी वाले सुझाव नहीं दिखेंगे।'
            : 'Choosing Free hides all purchase recommendations.'}
        </p>
      </div>

      <div>
        <label htmlFor="lang-pref" className="block font-semibold text-ink mb-1">
          {isHi ? 'सलाह भाषा' : 'Advice Language'}
        </label>
        <select
          id="lang-pref"
          value={langPref}
          onChange={(e) => onChange({ lang: e.target.value as Household['lang'] })}
          className="w-full rounded-control border border-line bg-surface p-2 text-ink font-medium"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
        </select>
      </div>
    </div>
  );
}
