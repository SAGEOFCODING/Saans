'use client';

import React from 'react';
import type { HourlyPoint, Span } from '@/domain/types';
import { getAQICategory } from '@/domain/aqi';
import { CATEGORY_COLORS, CATEGORY_NAMES_EN, CATEGORY_NAMES_HI } from './types';
import { isBestHour, isWorstHour, formatHourLabel, formatFullTime, getHourGuidance } from './helpers';

interface ChartViewProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  isHi: boolean;
  selectedHourIndex: number | null;
  onSelectHour: (index: number) => void;
}

export function ChartView({ hourly, bestWindow, worstWindow, isHi, selectedHourIndex, onSelectHour }: ChartViewProps) {
  const maxVal = Math.max(...hourly.map((h) => h.pm25), 100);
  const chartHeight = 84;
  const barWidth = 11;
  const barGap = 4;
  const totalWidth = hourly.length * (barWidth + barGap);

  const activePoint =
    selectedHourIndex !== null
      ? hourly[selectedHourIndex]
      : bestWindow
      ? hourly.find((h) => isBestHour(h.t, bestWindow)) || hourly[0]
      : hourly[0];

  const activeCategory = activePoint ? getAQICategory(activePoint.aqi) : 'poor';
  const activeColor = CATEGORY_COLORS[activeCategory] || '#7B1E3A';

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1 focus:outline-none" tabIndex={0} aria-label="Hourly interactive chart">
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
            const inBest = isBestHour(pt.t, bestWindow);
            const inWorst = isWorstHour(pt.t, worstWindow);
            const isSelected = selectedHourIndex === i;
            const patternId =
              cat === 'satisfactory' ? 'pat-sat'
              : cat === 'moderate' ? 'pat-mod'
              : cat === 'poor' ? 'pat-poor'
              : cat === 'very-poor' ? 'pat-verypoor'
              : cat === 'severe' ? 'pat-sev'
              : null;

            return (
              <g
                key={pt.t}
                tabIndex={0}
                role="button"
                aria-label={`${formatHourLabel(pt.t)}: ${pt.pm25} µg/m³, AQI ${pt.aqi}, ${cat}`}
                aria-pressed={isSelected}
                onClick={() => onSelectHour(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectHour(i); }
                  else if (e.key === 'ArrowRight' && i < hourly.length - 1) { e.preventDefault(); onSelectHour(i + 1); }
                  else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onSelectHour(i - 1); }
                }}
                className="cursor-pointer group transition-all outline-none"
              >
                <title>{`${pt.t}: ${pt.pm25} µg/m³ (AQI ${pt.aqi} - ${cat})`}</title>
                {inBest && (
                  <rect x={x - 1} y={0} width={barWidth + 2} height={chartHeight} fill="#0E6E8C" opacity={isSelected ? '0.25' : '0.14'} rx="3" />
                )}
                {inWorst && (
                  <rect x={x - 1} y={0} width={barWidth + 2} height={chartHeight} fill="#C62828" opacity={isSelected ? '0.22' : '0.10'} rx="3" />
                )}
                {isSelected && (
                  <rect x={x - 2} y={Math.max(0, y - 2)} width={barWidth + 4} height={h + 4} rx="4" fill="none" stroke="#0E6E8C" strokeWidth="2" className="animate-pulse" />
                )}
                <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={baseColor} className="group-hover:opacity-90 transition-opacity" />
                {patternId && <rect x={x} y={y} width={barWidth} height={h} rx="3" fill={`url(#${patternId})`} />}
                {i % 3 === 0 && (
                  <text
                    x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle"
                    className={`text-[10px] select-none font-medium tabular-nums font-mono ${isSelected ? 'fill-sky font-bold' : 'fill-ink-muted'}`}
                  >
                    {formatHourLabel(pt.t)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {activePoint && (
        <div className="rounded-control border border-line/50 bg-haze/40 p-3.5 sm:p-4 text-xs transition-all shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/20 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-ink">🕒 {formatFullTime(activePoint.t)}</span>
              {isBestHour(activePoint.t, bestWindow) && (
                <span className="rounded-chip bg-gain/15 border border-gain/30 px-2 py-0.5 text-[10px] font-bold text-gain">
                  ★ {isHi ? 'श्रेष्ठ समय' : 'Cleanest Window'}
                </span>
              )}
              {isWorstHour(activePoint.t, worstWindow) && (
                <span className="rounded-chip bg-aqi-verypoor/15 border border-aqi-verypoor/30 px-2 py-0.5 text-[10px] font-bold text-aqi-verypoor">
                  ▲ {isHi ? 'पीक स्मॉग' : 'Peak Smog'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-chip px-2.5 py-0.5 font-bold text-surface text-[11px]" style={{ backgroundColor: activeColor }}>
                <span>{isHi ? CATEGORY_NAMES_HI[activeCategory] : CATEGORY_NAMES_EN[activeCategory]}</span>
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">AQI {activePoint.aqi}</span>
              <span className="text-ink-muted">·</span>
              <span className="font-mono font-bold text-ink tabular-nums">{activePoint.pm25} µg/m³</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-ink-muted leading-relaxed">
            <span className="text-sky font-bold text-sm shrink-0">💡</span>
            <p className="text-xs text-ink/90 font-medium">{getHourGuidance(activePoint, isHi, bestWindow, worstWindow)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
