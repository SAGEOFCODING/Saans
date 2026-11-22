import React from 'react';
import type { Air } from '@/domain/types';

interface TelemetryPillsProps {
  air: Air;
  lang?: 'en' | 'hi';
}

export function HazeTelemetryPills({ air, lang = 'en' }: TelemetryPillsProps) {
  const isHi = lang === 'hi';

  return (
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
  );
}
