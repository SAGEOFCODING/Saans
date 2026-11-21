'use client';

import React, { useState } from 'react';
import type { Household, Location } from '@/domain/types';
import { StepLocation } from './stepper/StepLocation';
import { StepMembers } from './stepper/StepMembers';
import { StepHome } from './stepper/StepHome';
import { StepMobility } from './stepper/StepMobility';
import { StepBudgetLang } from './stepper/StepBudgetLang';

interface HouseholdStepperProps {
  household: Household;
  location: Location;
  onChangeHousehold: (h: Household) => void;
  onChangeLocation: (loc: Location) => void;
  onSubmit: () => void;
  loading?: boolean;
  lang?: 'en' | 'hi';
}

const STEP_TITLES = [
  { en: 'Location', hi: 'स्थान' },
  { en: 'Members', hi: 'सदस्य' },
  { en: 'Home', hi: 'आवास' },
  { en: 'Commute', hi: 'आवागमन' },
  { en: 'Budget', hi: 'बजट' },
];

export function HouseholdStepper({
  household,
  location,
  onChangeHousehold,
  onChangeLocation,
  onSubmit,
  loading = false,
  lang = 'en',
}: HouseholdStepperProps) {
  const [activeStep, setActiveStep] = useState(1);
  const isHi = lang === 'hi';

  const handleNext = () => {
    if (activeStep < 5) {
      setActiveStep(activeStep + 1);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="rounded-panel border border-line/70 bg-surface/95 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      {/* Header and Step Indicator */}
      <div className="mb-4 flex items-center justify-between border-b border-line/50 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight">
            {isHi ? 'परिवार का विवरण और दैनिक संदर्भ' : 'Household Profile & Daily Context'}
          </h2>
          <span className="text-[11px] text-ink-muted">
            {STEP_TITLES[activeStep - 1][isHi ? 'hi' : 'en']}
          </span>
        </div>
        <span className="rounded-chip bg-haze px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
          {isHi ? `चरण ${activeStep} / 5` : `Step ${activeStep} of 5`}
        </span>
      </div>

      {/* Progress Bar Segments */}
      <div className="mb-5 flex gap-1.5" role="tablist" aria-label="Wizard Steps">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            onClick={() => setActiveStep(s)}
            className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
              s === activeStep ? 'bg-sky' : s < activeStep ? 'bg-sky/40' : 'bg-line/60 hover:bg-line'
            }`}
            aria-label={`${s}. ${STEP_TITLES[s - 1][isHi ? 'hi' : 'en']}`}
            aria-selected={s === activeStep}
          />
        ))}
      </div>

      {/* Active Step Content */}
      <div className="min-h-[170px]">
        {activeStep === 1 && (
          <StepLocation location={location} onChange={onChangeLocation} lang={lang} />
        )}
        {activeStep === 2 && (
          <StepMembers
            members={household.members}
            onChange={(members) => onChangeHousehold({ ...household, members })}
            lang={lang}
          />
        )}
        {activeStep === 3 && (
          <StepHome
            home={household.home}
            onChange={(home) => onChangeHousehold({ ...household, home })}
            lang={lang}
          />
        )}
        {activeStep === 4 && (
          <StepMobility
            mobility={household.mobility}
            onChange={(mobility) => onChangeHousehold({ ...household, mobility })}
            lang={lang}
          />
        )}
        {activeStep === 5 && (
          <StepBudgetLang
            budget={household.budget}
            langPref={household.lang}
            onChange={(p) =>
              onChangeHousehold({
                ...household,
                ...(p.budget ? { budget: p.budget } : {}),
                ...(p.lang ? { lang: p.lang } : {}),
              })
            }
            lang={lang}
          />
        )}
      </div>

      {/* Navigation Controls */}
      <div id="stepper-controls" className="mt-5 flex items-center justify-between border-t border-line/50 pt-3.5">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeStep === 1}
          className="rounded-control px-3.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-haze/60 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
        >
          {isHi ? '← पिछला' : '← Back'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-control bg-sky px-4 py-2 text-xs font-bold text-on-sky shadow-xs hover:bg-sky-deep focus:outline-none focus:ring-2 focus:ring-sky focus:ring-offset-1 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{isHi ? 'योजना बन रही है...' : 'Generating Plan...'}</span>
            </>
          ) : activeStep < 5 ? (
            <span>{isHi ? 'अगला कदम →' : 'Next Step →'}</span>
          ) : (
            <span>{isHi ? 'स्वच्छ-वायु योजना बनाएं →' : 'Generate Clean-Air Plan →'}</span>
          )}
        </button>
      </div>
    </div>
  );
}
