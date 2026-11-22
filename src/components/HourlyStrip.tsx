'use client';

import React, { useState } from 'react';
import type { HourlyPoint, Span } from '@/domain/types';
import { getAQICategory } from '@/domain/aqi';
import regionsData from '@/data/regions.json';

interface HourlyStripProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  lang?: 'en' | 'hi';
  currentAqi?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  good: '#1B7F3B',
  satisfactory: '#4F7A12',
  moderate: '#F2C230',
  poor: '#E8730C',
  'very-poor': '#C62828',
  severe: '#7B1E3A',
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  good: 'Good',
  satisfactory: 'Satisfactory',
  moderate: 'Moderate',
  poor: 'Poor',
  'very-poor': 'Very Poor',
  severe: 'Severe',
};

const CATEGORY_NAMES_HI: Record<string, string> = {
  good: 'अच्छा (Good)',
  satisfactory: 'संतोषजनक (Satisfactory)',
  moderate: 'मध्यम (Moderate)',
  poor: 'खराब (Poor)',
  'very-poor': 'बहुत खराब (Very Poor)',
  severe: 'गंभीर (Severe)',
};

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
  const [expandedGrapStage, setExpandedGrapStage] = useState<number | null>(null);

  if (!hourly || hourly.length === 0) return null;

  const maxVal = Math.max(...hourly.map((h) => h.pm25), 100);
  const chartHeight = 84;
  const barWidth = 11;
  const barGap = 4;
  const totalWidth = hourly.length * (barWidth + barGap);

  const isBest = (timeStr: string) => {
    if (!bestWindow) return false;
    const cleanT = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
    return cleanT >= bestWindow.start && cleanT <= bestWindow.end;
  };

  const isWorst = (timeStr: string) => {
    if (!worstWindow) return false;
    const cleanT = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
    return cleanT >= worstWindow.start && cleanT <= worstWindow.end;
  };

  const formatHourLabel = (t: string) => {
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

  const formatFullTime = (t: string) => {
    let hStr = t;
    if (t.includes('T')) {
      hStr = t.split('T')[1];
    }
    const parts = hStr.split(':');
    const hour = parseInt(parts[0], 10);
    const mins = parts[1]?.slice(0, 2) || '00';
    if (isNaN(hour)) return t;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${parts[0]}:${mins} (${h12}:${mins} ${ampm})`;
  };

  const getHourGuidance = (pt: HourlyPoint) => {
    const inBest = isBest(pt.t);
    const inWorst = isWorst(pt.t);
    const cat = getAQICategory(pt.aqi);

    if (inBest) {
      return isHi
        ? '★ दिन का सबसे स्वच्छ समय: कमरे में ताजी हवा आने दें या जरूरी बाहरी कार्य निपटाएं।'
        : '★ Cleanest window today: Best time for natural room airing or quick errands.';
    }
    if (inWorst) {
      return isHi
        ? '▲ उच्चतम प्रदूषण का दौर: खिड़कियां बंद रखें, प्यूरीफायर चलाएं और बाहर जाने से बचें।'
        : '▲ Peak smog period: Seal windows, run purifiers on boost, avoid outdoor exertion.';
    }
    if (cat === 'good' || cat === 'satisfactory') {
      return isHi
        ? 'संतोषजनक वायु: सामान्य दिनचर्या व बाहरी गतिविधियां सुरक्षित हैं।'
        : 'Acceptable air: Safe for routine daily outdoor activities.';
    }
    if (cat === 'moderate') {
      return isHi
        ? 'मध्यम प्रदूषण: संवेदनशील लोग लंबे समय तक भारी व्यायाम से बचें।'
        : 'Moderate air: Sensitive members should avoid prolonged heavy exertion.';
    }
    if (cat === 'poor') {
      return isHi
        ? 'खराब वायु: बाहरी शारीरिक व्यायाम सीमित करें; बाहर निकलते समय N95 मास्क पहनें।'
        : 'Poor air: Limit strenuous outdoor exercise; wear a fitted N95 mask outdoors.';
    }
    return isHi
      ? 'अति-गंभीर प्रदूषण: खिड़कियां पूरी तरह बंद रखें और इनडोर एयर प्यूरीफायर चालू रखें।'
      : 'Severe smog: Stay indoors with HEPA air filtration running; avoid outdoor exposure.';
  };

  // Default inspection point
  const activePoint =
    selectedHourIndex !== null
      ? hourly[selectedHourIndex]
      : bestWindow
      ? hourly.find((h) => isBest(h.t)) || hourly[0]
      : hourly[0];

  const activeCategory = activePoint ? getAQICategory(activePoint.aqi) : 'poor';
  const activeColor = CATEGORY_COLORS[activeCategory] || '#7B1E3A';

  // Filtered rows for Table view
  const filteredHourly = hourly.filter((pt) => {
    if (tableFilter === 'clean') return isBest(pt.t);
    if (tableFilter === 'peak') return isWorst(pt.t);
    return true;
  });

  // GRAP stage calculations
  const effectiveAqi = currentAqi ?? hourly[0]?.aqi ?? 320;
  const activeGrapStage = regionsData.grapStages.find(
    (s) => effectiveAqi >= s.aqiMin && effectiveAqi <= s.aqiMax
  ) || (effectiveAqi > 450 ? regionsData.grapStages[regionsData.grapStages.length - 1] : null);

  return (
    <section
      aria-label={isHi ? '24 घंटे का वायु पूर्वानुमान' : '24-hour PM2.5 forecast'}
      className="my-5 rounded-panel border border-line/30 bg-surface/90 backdrop-blur-md p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all"
    >
      {/* Top Header & Interactive View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-line/20 pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight font-display">
            {isHi ? '24 घंटे का वायु पूर्वानुमान' : '24-Hour Forecast & Cleanest Window'}
          </h3>
          <p className="text-[11px] text-ink-muted">
            {isHi ? 'घंटेवार PM2.5 का रुझान और वेंटिलेशन विंडो' : 'Hourly PM2.5 curve & natural ventilation window'}
          </p>
        </div>

        {/* View Mode Tabs */}
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

      {/* Quick Window Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
        <div className="flex items-center gap-2">
          {bestWindow && (
            <button
              type="button"
              onClick={() => {
                const idx = hourly.findIndex((h) => isBest(h.t));
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
                const idx = hourly.findIndex((h) => isWorst(h.t));
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

      {/* MODE 1: INTERACTIVE GRAPHIC CHART */}
      {viewMode === 'chart' && (
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
                const inBest = isBest(pt.t);
                const inWorst = isWorst(pt.t);
                const isSelected = selectedHourIndex === i;

                return (
                  <g
                    key={pt.t}
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatHourLabel(pt.t)}: ${pt.pm25} µg/m³, AQI ${pt.aqi}, ${cat}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedHourIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedHourIndex(i);
                      } else if (e.key === 'ArrowRight' && i < hourly.length - 1) {
                        e.preventDefault();
                        setSelectedHourIndex(i + 1);
                      } else if (e.key === 'ArrowLeft' && i > 0) {
                        e.preventDefault();
                        setSelectedHourIndex(i - 1);
                      }
                    }}
                    className="cursor-pointer group transition-all outline-none"
                  >
                    <title>{`${pt.t}: ${pt.pm25} µg/m³ (AQI ${pt.aqi} - ${cat})`}</title>

                    {/* Highlight halo for best window */}
                    {inBest && (
                      <rect
                        x={x - 1}
                        y={0}
                        width={barWidth + 2}
                        height={chartHeight}
                        fill="#0E6E8C"
                        opacity={isSelected ? '0.25' : '0.14'}
                        rx="3"
                      />
                    )}

                    {/* Highlight for worst window */}
                    {inWorst && (
                      <rect
                        x={x - 1}
                        y={0}
                        width={barWidth + 2}
                        height={chartHeight}
                        fill="#C62828"
                        opacity={isSelected ? '0.22' : '0.10'}
                        rx="3"
                      />
                    )}

                    {/* Active Selection Glow Ring */}
                    {isSelected && (
                      <rect
                        x={x - 2}
                        y={Math.max(0, y - 2)}
                        width={barWidth + 4}
                        height={h + 4}
                        rx="4"
                        fill="none"
                        stroke="#0E6E8C"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Base bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="3"
                      fill={baseColor}
                      className="group-hover:opacity-90 transition-opacity"
                    />

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
                        className={`text-[10px] select-none font-medium tabular-nums font-mono ${
                          isSelected ? 'fill-sky font-bold' : 'fill-ink-muted'
                        }`}
                      >
                        {formatHourLabel(pt.t)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Inspection Card */}
          {activePoint && (
            <div className="rounded-control border border-line/50 bg-haze/40 p-3.5 sm:p-4 text-xs transition-all shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/20 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-ink">
                    🕒 {formatFullTime(activePoint.t)}
                  </span>
                  {isBest(activePoint.t) && (
                    <span className="rounded-chip bg-gain/15 border border-gain/30 px-2 py-0.5 text-[10px] font-bold text-gain">
                      ★ {isHi ? 'श्रेष्ठ समय' : 'Cleanest Window'}
                    </span>
                  )}
                  {isWorst(activePoint.t) && (
                    <span className="rounded-chip bg-aqi-verypoor/15 border border-aqi-verypoor/30 px-2 py-0.5 text-[10px] font-bold text-aqi-verypoor">
                      ▲ {isHi ? 'पीक स्मॉग' : 'Peak Smog'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-chip px-2.5 py-0.5 font-bold text-surface text-[11px]"
                    style={{ backgroundColor: activeColor }}
                  >
                    <span>{isHi ? CATEGORY_NAMES_HI[activeCategory] : CATEGORY_NAMES_EN[activeCategory]}</span>
                  </span>
                  <span className="font-mono font-bold text-ink tabular-nums">
                    AQI {activePoint.aqi}
                  </span>
                  <span className="text-ink-muted">·</span>
                  <span className="font-mono font-bold text-ink tabular-nums">
                    {activePoint.pm25} µg/m³
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-ink-muted leading-relaxed">
                <span className="text-sky font-bold text-sm shrink-0">💡</span>
                <p className="text-xs text-ink/90 font-medium">
                  {getHourGuidance(activePoint)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: INTERACTIVE HOURLY DATA TABLE */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-muted text-[11px] font-semibold">{isHi ? 'फ़िल्टर:' : 'Filter:'}</span>
            <button
              type="button"
              onClick={() => setTableFilter('all')}
              className={`rounded-chip px-2.5 py-0.5 font-medium border text-[11px] transition-colors ${
                tableFilter === 'all'
                  ? 'bg-sky/15 text-sky border-sky/30 font-bold'
                  : 'bg-surface text-ink-muted border-line/40 hover:text-ink'
              }`}
            >
              {isHi ? 'सभी 24 घंटे' : 'All 24 Hours'} ({hourly.length})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('clean')}
              className={`rounded-chip px-2.5 py-0.5 font-medium border text-[11px] transition-colors ${
                tableFilter === 'clean'
                  ? 'bg-gain/15 text-gain border-gain/30 font-bold'
                  : 'bg-surface text-ink-muted border-line/40 hover:text-ink'
              }`}
            >
              ★ {isHi ? 'श्रेष्ठ समय' : 'Cleanest Window'}
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('peak')}
              className={`rounded-chip px-2.5 py-0.5 font-medium border text-[11px] transition-colors ${
                tableFilter === 'peak'
                  ? 'bg-aqi-verypoor/15 text-aqi-verypoor border-aqi-verypoor/30 font-bold'
                  : 'bg-surface text-ink-muted border-line/40 hover:text-ink'
              }`}
            >
              ▲ {isHi ? 'उच्चतम प्रदूषण' : 'Peak Smog'}
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-control border border-line/40 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-haze/80 sticky top-0 z-10 border-b border-line/40 text-[11px] font-bold text-ink uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-2.5 px-3">{isHi ? 'समय' : 'Time'}</th>
                  <th scope="col" className="py-2.5 px-3">{isHi ? 'AQI सूचकांक' : 'AQI'}</th>
                  <th scope="col" className="py-2.5 px-3">PM2.5</th>
                  <th scope="col" className="py-2.5 px-3">{isHi ? 'श्रेणी' : 'Category'}</th>
                  <th scope="col" className="py-2.5 px-3">{isHi ? 'अनुशंसित दिशा-निर्देश' : 'Advisory / Recommended Action'}</th>
                  <th scope="col" className="py-2.5 px-3 text-right">{isHi ? 'स्थिति' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20 font-normal">
                {filteredHourly.map((pt) => {
                  const cat = getAQICategory(pt.aqi);
                  const color = CATEGORY_COLORS[cat] || '#7B1E3A';
                  const inBest = isBest(pt.t);
                  const inWorst = isWorst(pt.t);

                  return (
                    <tr
                      key={pt.t}
                      className={`hover:bg-haze/40 transition-colors ${
                        inBest ? 'bg-gain/5' : inWorst ? 'bg-aqi-verypoor/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-ink whitespace-nowrap">
                        {formatFullTime(pt.t)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold tabular-nums">
                        {pt.aqi}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium tabular-nums text-ink-muted whitespace-nowrap">
                        {pt.pm25} µg/m³
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className="inline-block px-2 py-0.5 rounded-chip text-[10px] font-bold text-surface"
                          style={{ backgroundColor: color }}
                        >
                          {isHi ? CATEGORY_NAMES_HI[cat] : CATEGORY_NAMES_EN[cat]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-ink/80 text-[11px] leading-tight max-w-xs">
                        {getHourGuidance(pt)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {inBest && (
                          <span className="rounded-chip bg-gain/15 border border-gain/20 px-2 py-0.5 text-[10px] font-bold text-gain">
                            ★ {isHi ? 'श्रेष्ठ' : 'Cleanest'}
                          </span>
                        )}
                        {inWorst && (
                          <span className="rounded-chip bg-aqi-verypoor/15 border border-aqi-verypoor/20 px-2 py-0.5 text-[10px] font-bold text-aqi-verypoor">
                            ▲ {isHi ? 'पीक' : 'Peak'}
                          </span>
                        )}
                        {!inBest && !inWorst && (
                          <span className="text-[10px] text-ink-muted font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: INTERACTIVE GRAP STAGE TABLE & GUIDE */}
      {viewMode === 'grap' && (
        <div className="space-y-3.5">
          <div className="rounded-control bg-sky/10 border border-sky/25 p-3 text-xs flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-sky">
                {isHi ? 'वर्तमान GRAP सक्रियता स्तर:' : 'Current Delhi-NCR GRAP Stage:'}
              </span>{' '}
              <span className="font-bold text-ink">
                {activeGrapStage ? activeGrapStage.name : isHi ? 'सामान्य (AQI ≤ 200)' : 'Normal (AQI ≤ 200)'}
              </span>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {isHi
                  ? 'ग्रेडेड रिस्पांस एक्शन प्लान (GRAP) सीएक्यूएम द्वारा दिल्ली-एनसीआर में प्रदूषण नियंत्रित करने हेतु कानूनी रूप से लागू किया जाता है।'
                  : 'Graded Response Action Plan (GRAP) is statutorily enforced across Delhi-NCR by CAQM based on ambient AQI.'}
              </p>
            </div>
            <span className="rounded-chip bg-surface border border-sky/30 px-3 py-1 font-mono font-bold text-sky text-xs shrink-0">
              AQI {effectiveAqi}
            </span>
          </div>

          {/* 4 Interactive Stage Cards / Table */}
          <div className="space-y-2">
            {regionsData.grapStages.map((stage) => {
              const isCurrent = activeGrapStage?.stage === stage.stage;
              const isExpanded = expandedGrapStage === stage.stage || (expandedGrapStage === null && isCurrent);

              return (
                <div
                  key={stage.stage}
                  className={`rounded-control border transition-all ${
                    isCurrent
                      ? 'border-caution bg-caution/5 shadow-xs ring-1 ring-caution/30'
                      : 'border-line/40 bg-surface/80 hover:bg-haze/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGrapStage(isExpanded ? 0 : stage.stage)}
                    className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? 'bg-caution text-surface'
                            : 'bg-haze text-ink-muted border border-line/40'
                        }`}
                      >
                        {stage.stage}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-ink text-xs">{stage.name}</h4>
                          {isCurrent && (
                            <span className="rounded-chip bg-caution/20 text-caution border border-caution/30 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              {isHi ? 'सक्रिय' : 'Active Now'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-ink-muted font-mono">
                          AQI {stage.aqiMin} – {stage.aqiMax}
                        </span>
                      </div>
                    </div>

                    <span className="text-ink-muted text-xs font-semibold">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-line/20 space-y-2">
                      <div>
                        <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                          {isHi ? 'लागू किए जाने वाले प्रतिबंध:' : 'Enforced Restrictions & Mandates:'}
                        </span>
                        <p className="text-ink/90 text-xs mt-0.5 leading-relaxed">
                          {stage.summary}
                        </p>
                      </div>
                      <div className="rounded-control bg-haze/50 p-2 text-[11px] text-ink-muted flex items-start gap-1.5">
                        <span className="text-sky font-bold">ℹ️</span>
                        <span>{stage.hint}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
