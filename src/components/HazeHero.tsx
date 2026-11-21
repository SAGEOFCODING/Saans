import React from 'react';
import type { Air, AirCategory } from '@/domain/types';
import { SkylineSvg } from './SkylineSvg';
import { CategoryIcon } from './CategoryIcon';

interface HazeHeroProps {
  air?: Air | null;
  loading?: boolean;
  onManualAqiClick?: () => void;
  lang?: 'en' | 'hi';
}

const CATEGORY_NAMES: Record<AirCategory, { en: string; hi: string; bg: string; text: string }> = {
  good: { en: 'Good', hi: 'अच्छा', bg: 'bg-aqi-good', text: 'text-white' },
  satisfactory: { en: 'Satisfactory', hi: 'संतोषजनक', bg: 'bg-aqi-satisfactory', text: 'text-white' },
  moderate: { en: 'Moderate', hi: 'मध्यम', bg: 'bg-aqi-moderate', text: 'text-ink' },
  poor: { en: 'Poor', hi: 'खराब', bg: 'bg-aqi-poor', text: 'text-ink' },
  'very-poor': { en: 'Very Poor', hi: 'बहुत खराब', bg: 'bg-aqi-verypoor', text: 'text-white' },
  severe: { en: 'Severe Smog', hi: 'गंभीर', bg: 'bg-aqi-severe', text: 'text-white' },
};

export function HazeHero({ air, loading, onManualAqiClick, lang = 'en' }: HazeHeroProps) {
  if (loading || !air) {
    return (
      <div className="relative overflow-hidden rounded-hero border border-line/60 bg-surface/95 p-6 shadow-sm animate-pulse">
        <div className="h-36 bg-line/20 rounded-panel mb-4" />
        <div className="h-9 w-48 bg-line/30 rounded-control mb-2" />
        <div className="h-4 w-64 bg-line/20 rounded-control" />
      </div>
    );
  }

  const category = air.category;
  const catMeta = CATEGORY_NAMES[category] ?? CATEGORY_NAMES.severe;
  const catLabel = lang === 'hi' ? catMeta.hi : catMeta.en;
  const isStale = air.ageMin > 15;

  return (
    <section
      aria-label="Current Air Quality Hero"
      className="relative overflow-hidden rounded-hero border border-line/60 bg-surface/95 p-5 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all"
    >
      {/* City Horizon Silhouette Canvas */}
      <div className="relative mb-5 overflow-hidden rounded-panel border border-line/40 shadow-xs">
        <SkylineSvg pm25={air.pm25} visibilityKm={air.visibilityKm} />
        {isStale ? (
          <span className="absolute top-3 right-3 rounded-chip bg-caution/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
            {air.ageMin}m old (cached)
          </span>
        ) : (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-chip bg-surface/90 backdrop-blur-md border border-line/60 px-2.5 py-1 text-[11px] font-medium text-ink shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-gain animate-pulse" />
            <span>Live Air Horizon</span>
          </span>
        )}
      </div>

      {/* Main AQI Telemetry Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <span className="text-5xl sm:text-6xl font-extrabold font-display tabular-nums tracking-tighter text-ink leading-none">
              {air.aqi}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-ink-muted/90">
                India NAQI · Dominant: {air.dominant.toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip text-xs font-bold tracking-tight shadow-xs ${catMeta.bg} ${catMeta.text}`}
              >
                <CategoryIcon category={category} size={13} />
                {catLabel}
              </span>
            </div>
          </div>

          <div className="mt-3.5 space-y-1">
            {air.visibilityKm !== undefined && (
              <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-sky shrink-0" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>
                  {lang === 'hi'
                    ? `आप लगभग ${air.visibilityKm} कि.मी. दूर तक देख सकते हैं।`
                    : `You can see about ${air.visibilityKm} km.`}
                </span>
              </p>
            )}
            <p className="text-xs text-ink-muted font-medium tabular-nums">
              {lang === 'hi'
                ? `PM2.5: ${air.pm25} µg/m³ · PM10: ${air.pm10} µg/m³`
                : `PM2.5: ${air.pm25} µg/m³ · PM10: ${air.pm10} µg/m³`}
            </p>
          </div>
        </div>

        {onManualAqiClick && (
          <button
            type="button"
            onClick={onManualAqiClick}
            className="self-start sm:self-end text-xs font-semibold text-sky hover:text-sky-deep underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-sky rounded transition-colors"
          >
            {lang === 'hi' ? 'AQI मैन्युअल दर्ज करें' : 'Enter manual AQI'}
          </button>
        )}
      </div>
    </section>
  );
}
