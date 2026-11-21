'use client';

import { useState, useMemo, useCallback } from 'react';
import { DayPlan, Household, ActionModifier } from '@/domain/types';
import { generateScheduleBlocks } from '@/domain/schedule';
import { calculateDailyExposure, applyModifiers } from '@/domain/exposure';

export interface WhatIfToggle {
  id: string;
  label: { en: string; hi: string };
  description: { en: string; hi: string };
  modifiers: ActionModifier[];
}

export const WHAT_IF_OPTIONS: WhatIfToggle[] = [
  {
    id: 'bedroom-purifier-night',
    label: {
      en: 'Run bedroom purifier overnight',
      hi: 'रात भर बेडरूम में प्यूरीफायर चलाएं',
    },
    description: {
      en: 'Reduces overnight particulate infiltration during nighttime thermal inversion.',
      hi: 'रात के समय प्रदूषण को बेडरूम में जमने से रोकता है।',
    },
    modifiers: [{ block: 'night-sleep', set: { envFactor: 0.3 } }],
  },
  {
    id: 'n95-commute',
    label: {
      en: 'Wear fitted N95 respirator on commute',
      hi: 'यात्रा के दौरान फिटेड N95 मास्क पहनें',
    },
    description: {
      en: 'Filters out >75% of particulate matter during peak traffic hours.',
      hi: 'सड़क के भारी ट्रैफिक में 75% से अधिक कणों को रोकता है।',
    },
    modifiers: [
      { block: 'commute-morning', set: { protectionFactor: 0.25 } },
      { block: 'commute-evening', set: { protectionFactor: 0.25 } },
    ],
  },
  {
    id: 'metro-commute',
    label: {
      en: 'Switch road commute to Metro',
      hi: 'सड़क यात्रा के बजाय मेट्रो चुनें',
    },
    description: {
      en: 'Underground/elevated metro air has lower particulate density than street traffic.',
      hi: 'सड़क के सीधे धुएं से बचाव होता है।',
    },
    modifiers: [
      { block: 'commute-morning', set: { envFactor: 0.4 } },
      { block: 'commute-evening', set: { envFactor: 0.4 } },
    ],
  },
  {
    id: 'clean-cooking-chimney',
    label: {
      en: 'Use kitchen chimney / exhaust fan',
      hi: 'रसोई में चिमनी या एग्जॉस्ट फैन चलाएं',
    },
    description: {
      en: 'Eliminates indoor combustion particulate peaks during meal preparation.',
      hi: 'खाना बनाते समय उठने वाले धुएं को तुरंत बाहर निकालता है।',
    },
    modifiers: [
      { block: 'morning-routine', set: { indoorSource: 0 } },
      { block: 'evening-routine', set: { indoorSource: 0 } },
    ],
  },
  {
    id: 'best-window-ventilation',
    label: {
      en: 'Ventilate only during best afternoon window',
      hi: 'केवल दोपहर की सबसे साफ हवा के समय खिड़कियां खोलें',
    },
    description: {
      en: 'Refreshes indoor CO₂ without letting in severe morning or nighttime smog.',
      hi: 'बिना जहरीला धुआं अंदर लाए घर की हवा ताज़ा करता है।',
    },
    modifiers: [{ block: 'daytime', set: { envFactor: 0.45 } }],
  },
];

export function useWhatIf(plan: DayPlan | null, household: Household) {
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  const toggleAction = useCallback((id: string) => {
    setActiveToggles((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const resetToggles = useCallback(() => {
    setActiveToggles([]);
  }, []);

  const simulation = useMemo(() => {
    if (!plan?.air) {
      return { baselineExposure: 100, currentExposure: 100, deltaPct: 0 };
    }

    const baseBlocks = generateScheduleBlocks(household, plan.air);
    const baselineExposure = calculateDailyExposure(baseBlocks);

    const activeModifiers: ActionModifier[] = WHAT_IF_OPTIONS.filter((opt) =>
      activeToggles.includes(opt.id)
    ).flatMap((opt) => opt.modifiers);

    const currentBlocks = applyModifiers(baseBlocks, activeModifiers);
    const currentExposure = calculateDailyExposure(currentBlocks);

    const deltaPct =
      baselineExposure > 0
        ? Math.round(((baselineExposure - currentExposure) / baselineExposure) * 100)
        : 0;

    return {
      baselineExposure: Math.round(baselineExposure),
      currentExposure: Math.round(currentExposure),
      deltaPct,
    };
  }, [plan, household, activeToggles]);

  return {
    baselineExposure: simulation.baselineExposure,
    currentExposure: simulation.currentExposure,
    deltaPct: simulation.deltaPct,
    activeToggles,
    toggleAction,
    resetToggles,
    isToggled: (id: string) => activeToggles.includes(id),
  };
}
