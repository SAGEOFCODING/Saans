'use client';

import React from 'react';
import type { Air, AirCategory } from '@/domain/types';
import { SkylineSvg } from './SkylineSvg';

interface HazeHeroProps {
  air?: Air | null;
  loading?: boolean;
  onManualAqiClick?: () => void;
  lang?: 'en' | 'hi';
  locationName?: string;
}

const CATEGORY_NAMES: Record<AirCategory, { en: string; hi: string; bg: string; text: string; dot: string }> = {
  good: { en: 'GOOD', hi: 'अच्छा', bg: 'bg-gain/15 text-gain border-gain/30', text: 'text-gain', dot: 'bg-gain' },
  satisfactory: { en: 'SATISFACTORY', hi: 'संतोषजनक', bg: 'bg-gain/15 text-gain border-gain/30', text: 'text-gain', dot: 'bg-gain' },
  moderate: { en: 'MODERATE', hi: 'मध्यम', bg: 'bg-caution/15 text-caution border-caution/30', text: 'text-caution', dot: 'bg-caution' },
  poor: { en: 'POOR', hi: 'खराब', bg: 'bg-aqi-poor/15 text-aqi-poor border-aqi-poor/30', text: 'text-aqi-poor', dot: 'bg-aqi-poor' },
  'very-poor': { en: 'VERY POOR', hi: 'बहुत खराब', bg: 'bg-error/15 text-error border-error/30', text: 'text-error', dot: 'bg-error' },
  severe: { en: 'Severe Smog', hi: 'गंभीर स्मॉग', bg: 'bg-error/20 text-error border-error/40', text: 'text-error', dot: 'bg-error' },
};

export function HazeHero({
  air,
  loading,
  onManualAqiClick,
  lang = 'en',
  locationName = 'Vasant Kunj, New Delhi',
}: HazeHeroProps) {
  const isHi = lang === 'hi';

  if (loading || !air) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-line/40 bg-surface/90 backdrop-blur-md p-6 shadow-sm animate-pulse">
        <div className="h-28 bg-line/20 rounded-lg mb-4" />
        <div className="h-10 w-48 bg-line/30 rounded-md mb-2" />
        <div className="h-4 w-64 bg-line/20 rounded-md" />
      </div>
    );
  }

  const category = air.category;
  const catMeta = CATEGORY_NAMES[category] ?? CATEGORY_NAMES.severe;
  const catLabel = isHi ? catMeta.hi : catMeta.en;
  const isStale = air.ageMin > 15;

  const advisoryText =
    category === 'good' || category === 'satisfactory'
      ? (isHi ? 'खुली हवा में व्यायाम सुरक्षित' : 'Safe for outdoor exercise')
      : category === 'moderate'
      ? (isHi ? 'संवेदनशील लोग मास्क पहनें' : 'Mask advised for sensitive groups')
      : category === 'poor'
      ? (isHi ? 'बाहरी शारीरिक श्रम सीमित करें' : 'Limit strenuous outdoor workouts')
      : (isHi ? 'खिड़कियां बंद रखें, प्यूरीफायर चलाएं' : 'Keep windows sealed');

  return (
    <section
      id="air-hero"
      aria-label={isHi ? 'वर्तमान वायु गुणवत्ता' : 'Current Outdoor Air Telemetry'}
      className="relative overflow-hidden rounded-xl border border-line/30 bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all"
    >
      {/* Background Skyline Canvas with Inversion Gradient */}
      <div className="relative mb-5 overflow-hidden rounded-lg border border-line/20 shadow-xs">
        <SkylineSvg pm25={air.pm25} visibilityKm={air.visibilityKm} />
        {isStale ? (
          <span className="absolute top-3 right-3 rounded-chip bg-caution/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-surface shadow-xs">
            {air.ageMin}m old (cached)
          </span>
        ) : (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-chip bg-surface/90 backdrop-blur-md border border-line/30 px-2.5 py-0.5 text-[10px] font-semibold text-on-surface shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            <span>{isHi ? 'लाइव मॉनिटरिंग' : 'Live Atmospheric Telemetry'}</span>
          </span>
        )}
      </div>

      {/* Main Metric Header & Health Advisory */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              {isHi ? 'बाहरी वायु टेलीमेट्री' : 'Outdoor Telemetry'} • {locationName}
            </span>
          </div>

          <div className="flex items-baseline gap-3.5">
            <span className="text-5xl sm:text-6xl font-extrabold font-display tabular-nums tracking-tight text-on-surface leading-none">
              {air.aqi}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                AQI • IN
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${catMeta.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${catMeta.dot}`} />
                <span>{catLabel}</span>
              </span>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            {air.visibilityKm !== undefined && (
              <span className="font-medium">
                {isHi
                  ? `दृश्यता ~${air.visibilityKm} कि.मी. • सुबह का शीत-इन्वेंशन`
                  : `You can see about ${air.visibilityKm} km. • Morning inversion`}
              </span>
            )}
            <span className="hidden sm:inline text-on-surface-variant/50">·</span>
            <span className="font-mono tabular-nums font-medium">
              PM2.5: {air.pm25} µg/m³
            </span>
          </div>
        </div>

        {/* Health Advisory Pill */}
        <div className="flex items-center gap-2.5 bg-surface-container-low/90 backdrop-blur-sm rounded-lg px-3.5 py-2.5 border border-line/30 shadow-xs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary shrink-0">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant">
              {isHi ? 'स्वास्थ्य सलाह' : 'Health Advisory'}
            </span>
            <span className="text-xs font-bold text-on-surface">
              {advisoryText}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Pill Horizontal Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* PM2.5 */}
        <div className="flex items-center gap-2.5 bg-surface-container-low/90 rounded-lg px-3 py-2 border border-line/20">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-error/10 text-error shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-on-surface-variant font-medium">PM2.5:</span>
            <span className="font-mono font-bold text-on-surface tabular-nums truncate text-xs">
              {air.pm25} µg/m³
            </span>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2.5 bg-surface-container-low/90 rounded-lg px-3 py-2 border border-line/20">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            </svg>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-on-surface-variant font-medium">{isHi ? 'हवा' : 'Wind'}</span>
            <span className="font-mono font-bold text-on-surface tabular-nums truncate text-xs">
              {air.windKmh} km/h
            </span>
          </div>
        </div>

        {/* Motion / Inversion */}
        <div
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${
            air.stagnant
              ? 'bg-error-container/40 border-error/30'
              : 'bg-surface-container-low/90 border-line/20'
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
              air.stagnant ? 'bg-error text-on-error' : 'bg-primary/10 text-primary'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-on-surface-variant font-medium">{isHi ? 'गति' : 'Motion'}</span>
            <span className={`font-bold truncate text-xs ${air.stagnant ? 'text-error' : 'text-on-surface'}`}>
              {air.stagnant ? (isHi ? 'स्थिर' : 'Stagnant') : (isHi ? 'सक्रिय' : 'Active')}
            </span>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-2.5 bg-surface-container-low/90 rounded-lg px-3 py-2 border border-line/20">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-on-surface-variant font-medium">{isHi ? 'नमी' : 'Humidity'}</span>
            <span className="font-mono font-bold text-on-surface tabular-nums truncate text-xs">
              {air.rh}%
            </span>
          </div>
        </div>
      </div>

      {onManualAqiClick && (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={onManualAqiClick}
            className="text-[11px] text-primary hover:underline font-semibold"
          >
            {isHi ? 'मैन्युअल AQI दर्ज करें →' : 'Enter manual AQI reading →'}
          </button>
        </div>
      )}
    </section>
  );
}
