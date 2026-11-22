'use client';

import React from 'react';
import type { Household, DayPlan } from '@/domain/types';
import { RiskSummary } from '../RiskSummary';
import { PlanTimeline } from '../PlanTimeline';
import { ImpactBar } from '../ImpactBar';
import { WhatIfPanel } from '../WhatIfPanel';
import { CommunityPack } from '../CommunityPack';

interface PlanDashboardProps {
  plan: DayPlan;
  household: Household;
  activeActionIds: string[];
  simulation: {
    baseline: number;
    simulated: number;
    deltaPct: number;
  };
  onToggleAction: (id: string, active: boolean) => void;
  lang?: 'en' | 'hi';
}

export function PlanDashboard({
  plan,
  household,
  activeActionIds,
  simulation,
  onToggleAction,
  lang = 'en',
}: PlanDashboardProps) {
  const targetMember =
    household.members.find((m) => m.band === 'infant' || m.band === 'senior')?.band ??
    'vulnerable member';

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 space-y-6">
        <RiskSummary risks={plan.risks} members={household.members} lang={lang} />
        <PlanTimeline
          blocks={plan.blocks}
          activeActionIds={activeActionIds}
          onToggleAction={onToggleAction}
          lang={lang}
        />
      </div>

      <aside className="lg:col-span-2 space-y-6 lg:sticky lg:top-20">
        <ImpactBar
          baseline={simulation.baseline || plan.baseline || 100}
          planned={simulation.simulated || plan.planned || 65}
          co2eSavedKg={1.75}
          targetMember={targetMember}
          lang={lang}
        />
        <WhatIfPanel
          activeActionIds={activeActionIds}
          onToggleAction={onToggleAction}
          deltaPct={simulation.deltaPct}
          lang={lang}
        />
        <CommunityPack initialHouseholds={120} lang={lang} />
      </aside>
    </div>
  );
}
