'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Air, Household, Location } from '@/domain/types';
import presetsData from '@/data/presets.json';
import { usePlan } from '@/hooks/usePlan';
import { useWhatIf } from '@/hooks/useWhatIf';
import { loadSessionItem, saveSessionItem } from '@/lib/storage';
import { ModeBanner } from './ModeBanner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { HazeHero } from './HazeHero';
import { StatusStrip } from './StatusStrip';
import { HourlyStrip } from './HourlyStrip';
import { PersonaPresets } from './PersonaPresets';
import { HouseholdStepper } from './HouseholdStepper';
import { RiskSummary } from './RiskSummary';
import { PlanTimeline } from './PlanTimeline';
import { ImpactBar } from './ImpactBar';
import { WhatIfPanel } from './WhatIfPanel';
import { CommunityPack } from './CommunityPack';
import { SafetyNote } from './SafetyNote';
import { ChatIcon } from './Icons';

const ChatSheet = dynamic(() => import('./ChatSheet'), { ssr: false });

const DEFAULT_HOUSEHOLD: Household = presetsData.priya.household as Household;
const DEFAULT_LOCATION: Location = { lat: 28.61, lon: 77.21, name: 'Delhi NCR' };

interface SaansAppProps {
  initialAir?: Air | null;
}

export function SaansApp({ initialAir }: SaansAppProps) {
  const [air] = useState<Air | null>(initialAir ?? null);
  const [household, setHousehold] = useState<Household>(() =>
    loadSessionItem<Household>('saans_household', DEFAULT_HOUSEHOLD)
  );
  const [location, setLocation] = useState<Location>(() =>
    loadSessionItem<Location>('saans_location', DEFAULT_LOCATION)
  );
  const [lang, setLang] = useState<'en' | 'hi'>(() =>
    loadSessionItem<'en' | 'hi'>('saans_lang', 'en')
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [activeActionIds, setActiveActionIds] = useState<string[]>([
    'bedroom-purifier-night',
    'n95-mask-commute',
  ]);

  const { plan, meta, loading, error, fetchPlan } = usePlan();
  const simulation = useWhatIf(household, air ?? plan?.air ?? null, activeActionIds);

  useEffect(() => {
    saveSessionItem('saans_household', household);
    saveSessionItem('saans_location', location);
  }, [household, location]);

  const handleToggleAction = useCallback((id: string, active: boolean) => {
    setActiveActionIds((prev) => (active ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  }, []);

  const handlePresetSelect = useCallback((h: Household) => {
    setHousehold(h);
  }, []);

  const handleGeneratePlan = useCallback(() => {
    fetchPlan(household, location, lang, air ?? undefined);
  }, [fetchPlan, household, location, lang, air]);

  const activeAir = air ?? plan?.air ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">Saans (सांस)</h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            {lang === 'hi' ? 'गंभीर स्मॉग के दौरान परिवारों का स्वच्छ-वायु गाइड' : 'Clean-air copilot for winter smog & urban air pollution'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          <button
            id="chat-trigger"
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 rounded-control bg-sky px-3.5 py-1.5 text-xs font-bold text-on-sky shadow-sm hover:bg-sky-deep focus:ring-2 focus:ring-sky"
            aria-label="Open AI advisor chat"
          >
            <ChatIcon size={16} />
            <span>{lang === 'hi' ? 'सलाहकार से पूछें' : 'Ask Saans'}</span>
          </button>
        </div>
      </header>

      <ModeBanner mode={meta?.mode} airSource={meta?.airSource} airAgeMin={meta?.airAgeMin} />
      <HazeHero air={activeAir} lang={lang} />
      {activeAir && <StatusStrip air={activeAir} lang={lang} />}
      {activeAir?.hourly && (
        <HourlyStrip hourly={activeAir.hourly} bestWindow={plan?.window?.best} worstWindow={plan?.window?.worst} lang={lang} />
      )}

      <PersonaPresets onSelectPreset={handlePresetSelect} lang={lang} />
      <HouseholdStepper
        household={household}
        location={location}
        onChangeHousehold={setHousehold}
        onChangeLocation={setLocation}
        onSubmit={handleGeneratePlan}
        loading={loading}
        lang={lang}
      />

      {error && (
        <div className="my-4 rounded-panel border border-danger-text/30 bg-danger-text/10 p-4 text-xs font-semibold text-danger-text">
          {error}
        </div>
      )}

      {plan && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <RiskSummary risks={plan.risks} members={household.members} lang={lang} />
            <PlanTimeline
              blocks={plan.blocks}
              activeActionIds={activeActionIds}
              onToggleAction={handleToggleAction}
              lang={lang}
            />
            <CommunityPack lang={lang} />
          </div>
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-4 self-start">
            <ImpactBar
              baseline={simulation.baseline || plan.baseline || 100}
              planned={simulation.simulated || plan.planned || 65}
              co2eSavedKg={1.75}
              lang={lang}
            />
            <WhatIfPanel
              activeActionIds={activeActionIds}
              onToggleAction={handleToggleAction}
              deltaPct={simulation.deltaPct}
              lang={lang}
            />
          </div>
        </div>
      )}

      <SafetyNote lang={lang} />
      <ChatSheet
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        household={household}
        location={location}
        lang={lang}
      />
    </div>
  );
}
