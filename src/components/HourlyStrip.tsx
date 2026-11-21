import React from 'react';
import type { HourlyPoint, Span } from '@/domain/types';
import { getAQICategory } from '@/domain/aqi';

interface HourlyStripProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  lang?: 'en' | 'hi';
}

const CATEGORY_COLORS = {
  good: '#1B7F3B',
  satisfactory: '#4F7A12',
  moderate: '#F2C230',
  poor: '#E8730C',
  'very-poor': '#C62828',
  severe: '#7B1E3A',
};

export function HourlyStrip({ hourly, bestWindow, worstWindow, lang = 'en' }: HourlyStripProps) {
  if (!hourly || hourly.length === 0) return null;

  const maxVal = Math.max(...hourly.map((h) => h.pm25), 100);
  const chartHeight = 84;
  const barWidth = 11;
  const barGap = 4;
  const totalWidth = hourly.length * (barWidth + barGap);

  const isBest = (timeStr: string) =>
    bestWindow && timeStr >= bestWindow.start && timeStr <= bestWindow.end;
  const isWorst = (timeStr: string) =>
    worstWindow && timeStr >= worstWindow.start && timeStr <= worstWindow.end;

  const formatHourLabel = (t: string) => {
    // Handle ISO string like "2026-11-21T06:00" or simple "06:00"
    let hStr = t;
    if (t.includes('T')) {
      hStr = t.split('T')[1];
    }
    const hour = parseInt(hStr.split(':')[0], 10);
    if (isNaN(hour)) return '';
    const ampm = hour >= 12 ? 'p' : 'a';
    const h12 = hour % 12 || 12;
    return `${h12}${ampm}`;
  };

  return (
    <section
      aria-label={lang === 'hi' ? '24 घंटे का वायु पूर्वानुमान' : '24-hour PM2.5 forecast'}
      className="my-4 rounded-panel border border-line/40 bg-surface/80 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 border-b border-line/20 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight font-display">
            {lang === 'hi' ? '24 घंटे का वायु पूर्वानुमान' : '24-Hour Forecast & Cleanest Window'}
          </h3>
          <p className="text-[11px] text-ink-muted">
            {lang === 'hi' ? 'घंटेवार PM2.5 का रुझान और वेंटिलेशन विंडो' : 'Hourly PM2.5 curve & natural ventilation window'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {bestWindow && (
            <span className="inline-flex items-center gap-1 rounded-chip bg-gain/10 border border-gain/20 px-2.5 py-0.5 font-semibold text-gain shadow-xs">
              ★ {lang === 'hi' ? 'श्रेष्ठ समय:' : 'Cleanest:'} {bestWindow.start}–{bestWindow.end}
            </span>
          )}
          {worstWindow && (
            <span className="inline-flex items-center gap-1 rounded-chip bg-aqi-verypoor/10 border border-aqi-verypoor/20 px-2.5 py-0.5 font-semibold text-aqi-verypoor shadow-xs">
              ▲ {lang === 'hi' ? 'उच्चतम प्रदूषण:' : 'Peak Smog:'} {worstWindow.start}–{worstWindow.end}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + 24}`}
          className="w-full h-28 min-w-[340px]"
          role="img"
          aria-label={`24-hour air forecast: Cleanest window ${bestWindow?.start ?? 'N/A'} to ${bestWindow?.end ?? 'N/A'}`}
        >
          <defs>
            <pattern id="pat-sat" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.6" />
            </pattern>
            <pattern id="pat-mod" width="6" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="6" x2="6" y2="0" stroke="#1F1A00" strokeWidth="1.2" opacity="0.4" />
            </pattern>
            <pattern id="pat-poor" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0,0 L6,6 M6,0 L0,6" stroke="#1A1A1A" strokeWidth="1" opacity="0.4" />
            </pattern>
            <pattern id="pat-verypoor" width="4" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="4" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
            </pattern>
            <pattern id="pat-sev" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#FFFFFF" opacity="0.8" />
            </pattern>
          </defs>

          {hourly.map((pt, i) => {
            const h = Math.max(6, Math.round((pt.pm25 / maxVal) * chartHeight));
            const x = i * (barWidth + barGap);
            const y = chartHeight - h;
            const cat = getAQICategory(pt.aqi);
            const baseColor = CATEGORY_COLORS[cat] || '#7B1E3A';
            const inBest = isBest(pt.t);
            const inWorst = isWorst(pt.t);

            return (
              <g key={pt.t} className="cursor-pointer">
                <title>{`${pt.t}: ${pt.pm25} µg/m³ (${cat})`}</title>
                {/* Highlight halo for best window */}
                {inBest && (
                  <rect x={x - 1} y={0} width={barWidth + 2} height={chartHeight} fill="#0E6E8C" opacity="0.14" rx="3" />
                )}
                {/* Highlight for worst window */}
                {inWorst && (
                  <rect x={x - 1} y={0} width={barWidth + 2} height={chartHeight} fill="#C62828" opacity="0.10" rx="3" />
                )}
                {/* Base bar */}
                <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={baseColor} />

                {/* Pattern overlay for accessibility */}
                {cat === 'satisfactory' && (
                  <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="url(#pat-sat)" />
                )}
                {cat === 'moderate' && (
                  <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="url(#pat-mod)" />
                )}
                {cat === 'poor' && (
                  <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="url(#pat-poor)" />
                )}
                {cat === 'very-poor' && (
                  <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="url(#pat-verypoor)" />
                )}
                {cat === 'severe' && (
                  <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="url(#pat-sev)" />
                )}

                {/* Time label below bar every 3 hours */}
                {i % 3 === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 15}
                    textAnchor="middle"
                    className="text-[10px] fill-ink-muted select-none font-medium tabular-nums font-mono"
                  >
                    {formatHourLabel(pt.t)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
