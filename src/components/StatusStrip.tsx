import React from 'react';
import type { Air } from '@/domain/types';

interface StatusStripProps {
  air: Air;
  lang?: 'en' | 'hi';
}

export function StatusStrip({ air, lang = 'en' }: StatusStripProps) {
  const isHi = lang === 'hi';

  return (
    <section
      role="region"
      aria-label={isHi ? 'वर्तमान वायुमंडलीय विवरण' : 'Current atmospheric conditions'}
      className="my-3 flex flex-wrap gap-2 text-xs font-medium text-ink-muted"
    >
      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-3 py-1.5 shadow-sm"
        aria-label={`PM 2.5: ${air.pm25} micrograms per cubic meter`}
      >
        <span className="font-semibold text-ink">PM2.5:</span> {air.pm25} µg/m³
      </div>

      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-3 py-1.5 shadow-sm"
        aria-label={`PM 10: ${air.pm10} micrograms per cubic meter`}
      >
        <span className="font-semibold text-ink">PM10:</span> {air.pm10} µg/m³
      </div>

      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-3 py-1.5 shadow-sm"
        aria-label={`Wind speed: ${air.windKmh} kilometers per hour`}
      >
        <span className="font-semibold text-ink">{isHi ? 'हवा:' : 'Wind:'}</span> {air.windKmh} km/h
      </div>

      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-3 py-1.5 shadow-sm"
        aria-label={`Temperature: ${air.tempC} degrees Celsius`}
      >
        <span className="font-semibold text-ink">{isHi ? 'तापमान:' : 'Temp:'}</span> {air.tempC}°C
      </div>

      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface px-3 py-1.5 shadow-sm"
        aria-label={`Relative humidity: ${air.rh} percent`}
      >
        <span className="font-semibold text-ink">{isHi ? 'नमी:' : 'Humidity:'}</span> {air.rh}%
      </div>

      {air.stagnant && (
        <div
          className="inline-flex items-center gap-1 rounded-chip border border-caution/40 bg-caution/10 px-3 py-1.5 font-semibold text-caution"
          aria-label="Stagnant air: Still, cold inversion trapping ground level pollutants"
        >
          {isHi ? 'शांत/स्थिर हवा (प्रदूषक जमाव)' : 'Stagnant Air (Trapping Smog)'}
        </div>
      )}

      <div
        className="inline-flex items-center gap-1 rounded-chip border border-line bg-surface/70 px-3 py-1.5 text-ink-muted/80 ml-auto"
        aria-label={`Data source: ${air.source}, updated ${air.ageMin} minutes ago`}
      >
        {air.source === 'live' && air.ageMin <= 15
          ? (isHi ? 'लाइव' : 'Live')
          : `${air.ageMin}m (${air.source})`}
      </div>
    </section>
  );
}
