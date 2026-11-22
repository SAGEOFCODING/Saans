'use client';

import React, { useState } from 'react';
import type { HourlyPoint, Span } from '@/domain/types';
import { ChartView } from './hourly/ChartView';
import { TableView } from './hourly/TableView';
import { GrapView } from './hourly/GrapView';
import { isBestHour, isWorstHour } from './hourly/helpers';

interface HourlyStripProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  lang?: 'en' | 'hi';
  currentAqi?: number;
}

export function HourlyStrip({
  hourly,
  bestWindow,
  worstWindow,
  lang = 'en',
  currentAqi,
}: HourlyStripProps) {
  const isHi = lang === 'hi';
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'grap'>('chart');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'clean' | 'peak'>('all');

  if (!hourly || hourly.length === 0) return null;

  const effectiveAqi = currentAqi ?? hourly[0]?.aqi ?? 320;

  return (
    <section
      aria-label={isHi ? '24 घंटे का वायु पूर्वानुमान' : '24-hour PM2.5 forecast'}
      className="my-5 rounded-panel border border-line/30 bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-line/20 pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight font-display">
            {isHi ? '24 घंटे का वायु पूर्वानुमान' : '24-Hour Forecast & Cleanest Window'}
          </h3>
          <p className="text-[11px] text-ink-muted">
            {isHi ? 'घंटेवार PM2.5 का रुझान और वेंटिलेशन विंडो' : 'Hourly PM2.5 curve & natural ventilation window'}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-control bg-haze p-1 border border-line/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            aria-pressed={viewMode === 'chart'}
            className={`flex items-center gap-1.5 rounded-chip px-3 py-1 transition-all ${
              viewMode === 'chart'
                ? 'bg-surface text-ink shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>{isHi ? 'ग्राफिक चार्ट' : 'Graphic Chart'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-pressed={viewMode === 'table'}
            className={`flex items-center gap-1.5 rounded-chip px-3 py-1 transition-all ${
              viewMode === 'table'
                ? 'bg-surface text-ink shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <span>{isHi ? 'घंटेवार तालिका' : 'Hourly Table'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grap')}
            aria-pressed={viewMode === 'grap'}
            className={`flex items-center gap-1.5 rounded-chip px-3 py-1 transition-all ${
              viewMode === 'grap'
                ? 'bg-surface text-ink shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{isHi ? 'GRAP नियम' : 'GRAP Rules'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
        <div className="flex items-center gap-2">
          {bestWindow && (
            <button
              type="button"
              onClick={() => {
                const idx = hourly.findIndex((h) => isBestHour(h.t, bestWindow));
                if (idx !== -1) setSelectedHourIndex(idx);
              }}
              className="inline-flex items-center gap-1 rounded-chip bg-gain/10 border border-gain/20 px-2.5 py-0.5 font-semibold text-gain shadow-xs hover:bg-gain/20 cursor-pointer transition-colors"
              title={isHi ? 'स्वच्छ समय देखने के लिए क्लिक करें' : 'Click to inspect cleanest window'}
            >
              ★ {isHi ? 'श्रेष्ठ समय:' : 'Cleanest:'} {bestWindow.start}–{bestWindow.end}
            </button>
          )}
          {worstWindow && (
            <button
              type="button"
              onClick={() => {
                const idx = hourly.findIndex((h) => isWorstHour(h.t, worstWindow));
                if (idx !== -1) setSelectedHourIndex(idx);
              }}
              className="inline-flex items-center gap-1 rounded-chip bg-aqi-verypoor/10 border border-aqi-verypoor/20 px-2.5 py-0.5 font-semibold text-aqi-verypoor shadow-xs hover:bg-aqi-verypoor/20 cursor-pointer transition-colors"
              title={isHi ? 'उच्चतम प्रदूषण समय देखने के लिए क्लिक करें' : 'Click to inspect peak smog'}
            >
              ▲ {isHi ? 'उच्चतम प्रदूषण:' : 'Peak Smog:'} {worstWindow.start}–{worstWindow.end}
            </button>
          )}
        </div>

        <span className="text-[11px] text-ink-muted">
          {viewMode === 'chart'
            ? (isHi ? 'किसी भी घंटे पर क्लिक करें या विवरण देखें' : 'Click or tap any hour bar to inspect details')
            : viewMode === 'table'
            ? (isHi ? 'सटीक डेटा तालिका' : 'Interactive 24-hour data table')
            : (isHi ? 'दिल्ली-एनसीआर ग्रेडेड रिस्पॉन्स एक्शन प्लान' : 'Delhi-NCR Graded Response Action Plan')}
        </span>
      </div>

      {viewMode === 'chart' && (
        <ChartView
          hourly={hourly}
          bestWindow={bestWindow}
          worstWindow={worstWindow}
          isHi={isHi}
          selectedHourIndex={selectedHourIndex}
          onSelectHour={setSelectedHourIndex}
        />
      )}

      {viewMode === 'table' && (
        <TableView
          hourly={hourly}
          bestWindow={bestWindow}
          worstWindow={worstWindow}
          isHi={isHi}
          tableFilter={tableFilter}
          onFilterChange={setTableFilter}
        />
      )}

      {viewMode === 'grap' && (
        <GrapView
          isHi={isHi}
          effectiveAqi={effectiveAqi}
        />
      )}
    </section>
  );
}
