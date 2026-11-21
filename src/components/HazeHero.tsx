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
      <div className="relative overflow-hidden rounded-hero border border-line bg-surface p-6 shadow-sm animate-pulse">
        <div className="h-32 bg-line/20 rounded-panel mb-4" />
        <div className="h-8 w-48 bg-line/30 rounded-control mb-2" />
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
      className="relative overflow-hidden rounded-hero border border-line bg-surface p-5 sm:p-7 shadow-sm"
    >
      <div className="relative mb-5">
        <SkylineSvg pm25={air.pm25} visibilityKm={air.visibilityKm} />
        {isStale && (
          <span className="absolute top-3 right-3 rounded-chip bg-caution/90 px-2.5 py-1 text-xs font-semibold text-white shadow">
            {air.ageMin}m old (cached)
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-5xl md:text-6xl font-bold font-display tabular-nums tracking-tight text-ink leading-none">
              {air.aqi}
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted">
                NAQI · {air.dominant.toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-sm font-semibold mt-1 ${catMeta.bg} ${catMeta.text}`}
              >
                <CategoryIcon category={category} size={13} />
                {catLabel}
              </span>
            </div>
          </div>

          <div className="mt-3 text-sm text-ink-muted">
            {air.visibilityKm !== undefined && (
              <p className="font-medium text-ink">
                {lang === 'hi'
                  ? `आप लगभग ${air.visibilityKm} कि.मी. दूर तक देख सकते हैं।`
                  : `You can see about ${air.visibilityKm} km.`}
              </p>
            )}
            <p className="mt-0.5 text-xs text-ink-muted">
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
            className="self-start sm:self-end text-xs font-semibold text-sky hover:text-sky-deep underline focus:outline-none focus:ring-2 focus:ring-sky rounded"
          >
            {lang === 'hi' ? 'AQI मैन्युअल दर्ज करें' : 'Enter manual AQI'}
          </button>
        )}
      </div>
    </section>
  );
}
