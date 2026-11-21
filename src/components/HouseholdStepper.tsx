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
  { en: '1. Location', hi: '1. स्थान' },
  { en: '2. Members', hi: '2. सदस्य' },
  { en: '3. Home', hi: '3. आवास' },
  { en: '4. Commute', hi: '4. आवागमन' },
  { en: '5. Budget', hi: '5. बजट' },
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
    <div className="rounded-panel border border-line bg-surface p-4 sm:p-6 shadow-sm">
      {/* Header and Step Indicator */}
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-base font-bold text-ink">
          {isHi ? 'परिवार का विवरण' : 'Household Profile & Daily Context'}
        </h2>
        <span className="text-xs font-semibold text-ink-muted">
          {isHi ? `चरण ${activeStep} / 5` : `Step ${activeStep} of 5`}
        </span>
      </div>

      {/* Progress Dots */}
      <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Wizard Steps">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            onClick={() => setActiveStep(s)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s === activeStep ? 'bg-sky' : s < activeStep ? 'bg-sky/40' : 'bg-line'
            }`}
            aria-label={`${STEP_TITLES[s - 1][isHi ? 'hi' : 'en']}`}
            aria-selected={s === activeStep}
          />
        ))}
      </div>

      {/* Active Step Content */}
      <div className="min-h-[160px]">
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
      <div id="stepper-controls" className="mt-5 flex items-center justify-between border-t border-line pt-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeStep === 1}
          className="rounded-control px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
        >
          {isHi ? '← पिछला' : '← Back'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="rounded-control bg-sky px-4 py-2 text-xs font-bold text-on-sky shadow hover:bg-sky-deep focus:outline-none focus:ring-2 focus:ring-sky"
        >
          {loading
            ? (isHi ? 'गणना जारी...' : 'Building Plan...')
            : activeStep === 5
            ? (isHi ? 'दैनिक योजना देखें' : 'Generate My Plan')
            : (isHi ? 'अगला →' : 'Next →')}
        </button>
      </div>
    </div>
  );
}
