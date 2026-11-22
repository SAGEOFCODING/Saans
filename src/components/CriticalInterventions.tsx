'use client';

import React, { useState } from 'react';
import type { Intervention } from './interventions/types';
import { INITIAL_INTERVENTIONS } from './interventions/types';
import { InterventionRow } from './interventions/InterventionRow';

interface CriticalInterventionsProps {
  onToggleAction?: (actionId: string, active: boolean) => void;
  lang?: 'en' | 'hi';
}

export function CriticalInterventions({ onToggleAction, lang = 'en' }: CriticalInterventionsProps) {
  const isHi = lang === 'hi';
  const [items, setItems] = useState<Intervention[]>(INITIAL_INTERVENTIONS);

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
          {isHi ? `${items.length} में से ${pendingCount} शेष` : `${pendingCount} of ${items.length} Pending`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <InterventionRow key={item.id} item={item} isHi={isHi} onToggle={toggleItem} />
        ))}
      </div>
    </section>
  );
}
