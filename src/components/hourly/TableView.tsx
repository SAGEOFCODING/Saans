'use client';

import React from 'react';
import type { HourlyPoint, Span } from '@/domain/types';
import { getAQICategory } from '@/domain/aqi';
import { CATEGORY_COLORS, CATEGORY_NAMES_EN, CATEGORY_NAMES_HI } from './types';
import { isBestHour, isWorstHour, formatFullTime, getHourGuidance } from './helpers';

interface TableViewProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  isHi: boolean;
  tableFilter: 'all' | 'clean' | 'peak';
  onFilterChange: (f: 'all' | 'clean' | 'peak') => void;
}

export function TableView({ hourly, bestWindow, worstWindow, isHi, tableFilter, onFilterChange }: TableViewProps) {
  const filteredHourly = hourly.filter((pt) => {
    if (tableFilter === 'clean') return isBestHour(pt.t, bestWindow);
    if (tableFilter === 'peak') return isWorstHour(pt.t, worstWindow);
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-muted text-[11px] font-semibold">{isHi ? 'फ़िल्टर:' : 'Filter:'}</span>
        {(['all', 'clean', 'peak'] as const).map((f) => {
          const label = f === 'all'
            ? `${isHi ? 'सभी 24 घंटे' : 'All 24 Hours'} (${hourly.length})`
            : f === 'clean'
            ? `★ ${isHi ? 'श्रेष्ठ समय' : 'Cleanest Window'}`
            : `▲ ${isHi ? 'उच्चतम प्रदूषण' : 'Peak Smog'}`;
          const active = tableFilter === f;
          const colorCls = f === 'all'
            ? (active ? 'bg-sky/15 text-sky border-sky/30 font-bold' : '')
            : f === 'clean'
            ? (active ? 'bg-gain/15 text-gain border-gain/30 font-bold' : '')
            : (active ? 'bg-aqi-verypoor/15 text-aqi-verypoor border-aqi-verypoor/30 font-bold' : '');
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={`rounded-chip px-2.5 py-0.5 font-medium border text-[11px] transition-colors ${
                active ? colorCls : 'bg-surface text-ink-muted border-line/40 hover:text-ink'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

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
              const inBest = isBestHour(pt.t, bestWindow);
              const inWorst = isWorstHour(pt.t, worstWindow);
              return (
                <tr key={pt.t} className={`hover:bg-haze/40 transition-colors ${inBest ? 'bg-gain/5' : inWorst ? 'bg-aqi-verypoor/5' : ''}`}>
                  <td className="py-2.5 px-3 font-mono font-semibold text-ink whitespace-nowrap">{formatFullTime(pt.t)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold tabular-nums">{pt.aqi}</td>
                  <td className="py-2.5 px-3 font-mono font-medium tabular-nums text-ink-muted whitespace-nowrap">{pt.pm25} µg/m³</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-chip text-[10px] font-bold text-surface" style={{ backgroundColor: color }}>
                      {isHi ? CATEGORY_NAMES_HI[cat] : CATEGORY_NAMES_EN[cat]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ink/80 text-[11px] leading-tight max-w-xs">{getHourGuidance(pt, isHi, bestWindow, worstWindow)}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {inBest && <span className="rounded-chip bg-gain/15 border border-gain/20 px-2 py-0.5 text-[10px] font-bold text-gain">★ {isHi ? 'श्रेष्ठ' : 'Cleanest'}</span>}
                    {inWorst && <span className="rounded-chip bg-aqi-verypoor/15 border border-aqi-verypoor/20 px-2 py-0.5 text-[10px] font-bold text-aqi-verypoor">▲ {isHi ? 'पीक' : 'Peak'}</span>}
                    {!inBest && !inWorst && <span className="text-[10px] text-ink-muted font-mono">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
