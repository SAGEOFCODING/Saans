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
      className="my-3 space-y-2.5"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 rounded-panel border border-line/30 bg-surface/90 backdrop-blur-md p-2 divide-y sm:divide-y-0 sm:divide-x divide-line/20 text-xs shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* PM2.5 */}
        <div
          className="flex flex-col justify-between p-3 sm:px-4"
          aria-label={`PM 2.5: ${air.pm25} micrograms per cubic meter`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>PM2.5:</span>
            <span className="h-1.5 w-1.5 rounded-full bg-sky" />
          </div>
          <div className="mt-1.5 font-bold text-ink tabular-nums text-sm font-mono tracking-tight">
            {air.pm25} µg/m³
          </div>
        </div>

        {/* PM10 */}
        <div
          className="flex flex-col justify-between p-3 sm:px-4"
          aria-label={`PM 10: ${air.pm10} micrograms per cubic meter`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>PM10:</span>
            <span className="h-1.5 w-1.5 rounded-full bg-sky/70" />
          </div>
          <div className="mt-1.5 font-bold text-ink tabular-nums text-sm font-mono tracking-tight">
            {air.pm10} µg/m³
          </div>
        </div>

        {/* Wind */}
        <div
          className="flex flex-col justify-between p-3 sm:px-4"
          aria-label={`Wind speed: ${air.windKmh} kilometers per hour`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>{isHi ? 'हवा:' : 'Wind:'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted/70"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/></svg>
          </div>
          <div className="mt-1.5 font-bold text-ink tabular-nums text-sm font-mono tracking-tight">
            {air.windKmh} km/h
          </div>
        </div>

        {/* Temperature */}
        <div
          className="flex flex-col justify-between p-3 sm:px-4"
          aria-label={`Temperature: ${air.tempC} degrees Celsius`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>{isHi ? 'तापमान:' : 'Temp:'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted/70"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
          </div>
          <div className="mt-1.5 font-bold text-ink tabular-nums text-sm font-mono tracking-tight">
            {air.tempC}°C
          </div>
        </div>

        {/* Humidity */}
        <div
          className="flex flex-col justify-between p-3 sm:px-4"
          aria-label={`Relative humidity: ${air.rh} percent`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>{isHi ? 'नमी:' : 'Humidity:'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted/70"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          </div>
          <div className="mt-1.5 font-bold text-ink tabular-nums text-sm font-mono tracking-tight">
            {air.rh}%
          </div>
        </div>
      </div>

      {/* Stagnant Air alert / thermal inversion banner */}
      {air.stagnant && (
        <div
          className="flex items-center gap-2.5 rounded-control border border-caution/25 bg-caution/10 px-4 py-2.5 text-xs font-semibold text-caution shadow-xs backdrop-blur-xs"
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
