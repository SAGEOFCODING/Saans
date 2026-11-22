import React from 'react';

interface StepperProgressProps {
  activeStep: number;
  stepTitles: Array<{ en: string; hi: string }>;
  isHi: boolean;
  onStepClick: (step: number) => void;
}

export function StepperProgress({ activeStep, stepTitles, isHi, onStepClick }: StepperProgressProps) {
  return (
    <div className="mb-6 flex gap-2" role="tablist" aria-label="Wizard Steps">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          onClick={() => onStepClick(s)}
          className={`h-2 flex-1 rounded-full transition-all duration-200 ${
            s === activeStep ? 'bg-sky shadow-xs' : s < activeStep ? 'bg-sky/40' : 'bg-line/40 hover:bg-line/60'
          }`}
          aria-label={`${s}. ${stepTitles[s - 1][isHi ? 'hi' : 'en']}`}
          aria-selected={s === activeStep}
        />
      ))}
    </div>
  );
}
