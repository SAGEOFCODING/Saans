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
      className="my-3 space-y-2"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
        {/* PM2.5 */}
        <div
          className="flex flex-col justify-between rounded-control border border-line/70 bg-surface/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          aria-label={`PM 2.5: ${air.pm25} micrograms per cubic meter`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            PM2.5:
          </span>
          <div className="mt-1 font-bold text-ink tabular-nums">
            {air.pm25} µg/m³
          </div>
        </div>

        {/* PM10 */}
        <div
          className="flex flex-col justify-between rounded-control border border-line/70 bg-surface/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          aria-label={`PM 10: ${air.pm10} micrograms per cubic meter`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            PM10:
          </span>
          <div className="mt-1 font-bold text-ink tabular-nums">
            {air.pm10} µg/m³
          </div>
        </div>

        {/* Wind */}
        <div
          className="flex flex-col justify-between rounded-control border border-line/70 bg-surface/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          aria-label={`Wind speed: ${air.windKmh} kilometers per hour`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {isHi ? 'हवा:' : 'Wind:'}
          </span>
          <div className="mt-1 font-bold text-ink tabular-nums">
            {air.windKmh} km/h
          </div>
        </div>

        {/* Temperature */}
        <div
          className="flex flex-col justify-between rounded-control border border-line/70 bg-surface/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          aria-label={`Temperature: ${air.tempC} degrees Celsius`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {isHi ? 'तापमान:' : 'Temp:'}
          </span>
          <div className="mt-1 font-bold text-ink tabular-nums">
            {air.tempC}°C
          </div>
        </div>

        {/* Humidity */}
        <div
          className="flex flex-col justify-between rounded-control border border-line/70 bg-surface/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          aria-label={`Relative humidity: ${air.rh} percent`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {isHi ? 'नमी:' : 'Humidity:'}
          </span>
          <div className="mt-1 font-bold text-ink tabular-nums">
            {air.rh}%
          </div>
        </div>
      </div>

      {/* Stagnant Air alert / thermal inversion banner */}
      {air.stagnant && (
        <div
          className="flex items-center gap-2 rounded-control border border-caution/30 bg-caution/10 px-3.5 py-2 text-xs font-semibold text-caution shadow-xs"
          aria-label="Stagnant air: Still, cold inversion trapping ground level pollutants"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {isHi
              ? 'Stagnant Air (Trapping Smog) — शांत हवा और तापमान प्रतिलोमन के कारण सतह पर स्मॉग का जमाव।'
              : 'Stagnant Air (Trapping Smog) — Inversion layer trapping particulates near ground level.'}
          </span>
        </div>
      )}
    </section>
  );
}
