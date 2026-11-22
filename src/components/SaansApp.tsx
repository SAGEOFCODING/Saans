'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Air, Household, Location } from '@/domain/types';
import presetsData from '@/data/presets.json';
import { usePlan } from '@/hooks/usePlan';
import { useWhatIf } from '@/hooks/useWhatIf';
import { loadSessionItem, saveSessionItem } from '@/lib/storage';
import { AppHeader } from './AppHeader';
import { ModeBanner } from './ModeBanner';
import { HazeHero } from './HazeHero';
import { CleanWindowBanner } from './CleanWindowBanner';
import { HourlyStrip } from './HourlyStrip';
import { CriticalInterventions } from './CriticalInterventions';
import { IndoorSanctuaryCard } from './IndoorSanctuaryCard';
import { CleanAirAdvisorCard } from './CleanAirAdvisorCard';
import { FloatingAdvisorBar } from './FloatingAdvisorBar';
import { PersonaPresets } from './PersonaPresets';
import { HouseholdStepper } from './HouseholdStepper';
import { RiskSummary } from './RiskSummary';
import { PlanTimeline } from './PlanTimeline';
import { ImpactBar } from './ImpactBar';
import { WhatIfPanel } from './WhatIfPanel';
import { CommunityPack } from './CommunityPack';
import { SafetyNote } from './SafetyNote';

const ChatSheet = dynamic(() => import('./ChatSheet'), { ssr: false });

const DEFAULT_HOUSEHOLD: Household = presetsData.priya.household as Household;
const DEFAULT_LOCATION: Location = { lat: 28.61, lon: 77.21, name: 'Vasant Kunj, New Delhi' };

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
  const [showPresets, setShowPresets] = useState(false);
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
    setShowPresets(false);
  }, []);

  const handleGeneratePlan = useCallback(() => {
    fetchPlan(household, location, lang, air ?? undefined);
  }, [fetchPlan, household, location, lang, air]);

  const handleOpenChatWithQuery = useCallback((query?: string) => {
    setChatOpen(true);
    // If a query was passed, it can be consumed by the chat drawer
    if (query) {
      setTimeout(() => {
        const chatInput = document.querySelector('textarea#advisor-chat-input') as HTMLTextAreaElement | null;
        if (chatInput) {
          chatInput.value = query;
          chatInput.focus();
        }
      }, 300);
    }
  }, []);

  const activeAir = air ?? plan?.air ?? null;

  return (
    <div className="min-h-screen bg-surface-bright text-on-surface font-body-md flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Atmospheric Glass Header */}
      <AppHeader
        location={location}
        onChangeLocationClick={() => {
          const newName = prompt(
            lang === 'hi' ? 'अपना शहर दर्ज करें (उदा. Delhi, Noida, Gurugram):' : 'Enter city name (e.g. Delhi, Noida, Gurugram):',
            location.name
          );
          if (newName && newName.trim()) {
            setLocation((prev) => ({ ...prev, name: newName.trim() }));
          }
        }}
        lang={lang}
        onLangChange={setLang}
        onOpenChat={handleOpenChatWithQuery}
        onOpenPresets={() => setShowPresets((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-28 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Mode / Degraded status banner */}
          <ModeBanner mode={meta?.mode} airSource={meta?.airSource} airAgeMin={meta?.airAgeMin} />

          {/* Quick Persona Presets Drawer (collapsible) */}
          {showPresets && (
            <div className="rounded-xl border border-line/40 bg-surface/90 backdrop-blur-md p-4 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-3 border-b border-line/20 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-ink-muted">
                  {lang === 'hi' ? 'त्वरित पारिवारिक प्रोफाइल चुनें:' : 'Select Household Persona:'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPresets(false)}
                  className="text-xs text-ink-muted hover:text-ink font-semibold"
                >
                  ✕ {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
              <PersonaPresets onSelectPreset={handlePresetSelect} lang={lang} />
            </div>
          )}

          {/* 12-Column Grid (Left: 7 cols Telemetry & Forecast / Right: 5 cols Interventions & Sanctuary) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Hero Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
              {/* 1. Haze Horizon Card */}
              <HazeHero
                air={activeAir}
                lang={lang}
                locationName={location.name}
              />

              {/* 2. Quick Clean Window Banner */}
              <CleanWindowBanner
                bestWindow={plan?.window?.best}
                lang={lang}
              />

              {/* 3. 24-Hour Pollution Curve Card */}
              {activeAir?.hourly && (
                <div id="forecast-curve">
                  <HourlyStrip
                    hourly={activeAir.hourly}
                    bestWindow={plan?.window?.best}
                    worstWindow={plan?.window?.worst}
                    lang={lang}
                    currentAqi={activeAir.aqi}
                  />
                </div>
              )}
            </div>

            {/* Right Action Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
              {/* 1. Critical Family Interventions */}
              <CriticalInterventions
                onToggleAction={handleToggleAction}
                lang={lang}
              />

              {/* 2. Indoor Sanctuary Status Card */}
              <IndoorSanctuaryCard
                lang={lang}
              />

              {/* 3. Clean-Air Advisor Prompt Card */}
              <CleanAirAdvisorCard
                onAsk={handleOpenChatWithQuery}
                lang={lang}
              />
            </div>
          </div>

          {/* Persona Presets (Always accessible in main stream) */}
          {!showPresets && (
            <div className="pt-2">
              <PersonaPresets onSelectPreset={handlePresetSelect} lang={lang} />
            </div>
          )}

          {/* 5-Step Household Stepper Form */}
          <div className="pt-2">
            <HouseholdStepper
              household={household}
              location={location}
              onChangeHousehold={setHousehold}
              onChangeLocation={setLocation}
              onSubmit={handleGeneratePlan}
              loading={loading}
              lang={lang}
            />
          </div>

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
            <div className="my-4 rounded-xl border border-error/30 bg-error/10 p-4 text-xs font-semibold text-error">
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

              <aside className="lg:col-span-2 space-y-6 lg:sticky lg:top-20">
                <ImpactBar
                  baseline={simulation.baseline || plan.baseline || 100}
                  planned={simulation.simulated || plan.planned || 65}
                  co2eSavedKg={1.75}
                  targetMember={
                    household.members.find((m) => m.band === 'infant' || m.band === 'senior')?.band ??
                    'vulnerable member'
                  }
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
          <footer className="pt-8 border-t border-line/30 space-y-4">
            <SafetyNote lang={lang} />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-xs pb-6">
              <span>Saans (साँस) — Clean-Air Copilot for Families</span>
              <span>Real-time NAQI Telemetry & Indoor Protection • Built for Winter Smog</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Persistent Floating Bottom Copilot Bar */}
      <FloatingAdvisorBar
        onOpenChat={handleOpenChatWithQuery}
        lang={lang}
      />

      {/* Chat Sheet (SSE streaming Gemini) */}
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
