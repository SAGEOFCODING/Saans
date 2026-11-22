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
import { ThemeToggle } from './ThemeToggle';
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line/20 pb-5 pt-1">
        <div className="flex items-center gap-3.5">
          {/* Logo Mark */}
          <div className="h-10 w-10 rounded-2xl bg-sky text-on-sky flex items-center justify-center font-bold shadow-xs">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
              <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink">
                Saans (सांस)
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-chip bg-gain/10 border border-gain/20 px-2.5 py-0.5 text-[11px] font-semibold text-gain shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-gain animate-pulse" />
                <span>Delhi NCR Live</span>
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              {lang === 'hi'
                ? 'गंभीर स्मॉग के दौरान परिवारों का स्वच्छ-वायु गाइड'
                : 'Clean-air copilot for winter smog & urban air pollution'}
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          <button
            id="chat-trigger"
            type="button"
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-control bg-sky px-4 py-2 text-xs font-bold text-on-sky shadow-xs hover:bg-sky-deep focus:ring-2 focus:ring-sky transition-all active:scale-[0.98]"
            aria-label="Open AI advisor chat"
          >
            <ChatIcon size={15} />
            <span>{lang === 'hi' ? 'सलाहकार से पूछें' : 'Ask Saans'}</span>
          </button>
        </div>
      </header>

      {/* Mode / Degraded status banner */}
      <ModeBanner mode={meta?.mode} airSource={meta?.airSource} airAgeMin={meta?.airAgeMin} />

      {/* Haze Horizon & Weather Strip */}
      <div className="space-y-3">
        <HazeHero air={activeAir} lang={lang} />
        {activeAir && <StatusStrip air={activeAir} lang={lang} />}
        {activeAir?.hourly && (
          <HourlyStrip
            hourly={activeAir.hourly}
            bestWindow={plan?.window?.best}
            worstWindow={plan?.window?.worst}
            lang={lang}
          />
        )}
      </div>

      {/* Quick Persona Presets */}
      <PersonaPresets onSelectPreset={handlePresetSelect} lang={lang} />

      {/* 5-Step Household Stepper */}
      <HouseholdStepper
        household={household}
        location={location}
        onChangeHousehold={setHousehold}
        onChangeLocation={setLocation}
        onSubmit={handleGeneratePlan}
        loading={loading}
        lang={lang}
      />

      {/* Screen Reader Live Status */}
      <div aria-live="polite" className="sr-only">
        {loading
          ? (lang === 'hi'
              ? 'आपकी दैनिक स्वच्छ-वायु योजना बनाई जा रही है...'
              : 'Generating your personalized clean-air plan...')
          : plan
          ? (lang === 'hi'
              ? `स्वच्छ-वायु योजना तैयार है: ${plan.blocks.length} समय-खंड और अनुशंसित उपाय।`
              : `Clean-air plan ready: ${plan.blocks.length} schedule blocks with recommended actions.`)
          : ''}
      </div>

      {/* Error state */}
      {error && (
        <div className="my-4 rounded-panel border border-danger-text/30 bg-danger-text/10 p-4 text-xs font-semibold text-danger-text">
          {error}
        </div>
      )}

      {/* Generated Plan Section (60% timeline / 40% sticky what-if & impact panel) */}
      {plan && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-6">
            <RiskSummary risks={plan.risks} members={household.members} lang={lang} />
            <PlanTimeline
              blocks={plan.blocks}
              activeActionIds={activeActionIds}
              onToggleAction={handleToggleAction}
              lang={lang}
            />
          </div>

          <aside className="lg:col-span-2 space-y-6 lg:sticky lg:top-4">
            <ImpactBar
              baseline={simulation.baseline || plan.baseline || 100}
              planned={simulation.simulated || plan.planned || 65}
              co2eSavedKg={1.75}
              targetMember={household.members.find((m) => m.band === 'infant' || m.band === 'senior')?.band ?? 'vulnerable member'}
              lang={lang}
            />
            <WhatIfPanel
              activeActionIds={activeActionIds}
              onToggleAction={handleToggleAction}
              deltaPct={simulation.deltaPct}
              lang={lang}
            />
            <CommunityPack initialHouseholds={120} lang={lang} />
          </aside>
        </div>
      )}

      {/* Bottom Safety Note */}
      <footer className="pt-6 border-t border-line/40">
        <SafetyNote lang={lang} />
      </footer>

      {/* Chat Sheet (SSE) */}
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
