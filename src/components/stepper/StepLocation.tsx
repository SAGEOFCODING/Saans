'use client';

import React from 'react';
import type { Location } from '@/domain/types';

interface StepLocationProps {
  location: Location;
  onChange: (loc: Location) => void;
  lang?: 'en' | 'hi';
}

export function StepLocation({ location, onChange, lang = 'en' }: StepLocationProps) {
  const isHi = lang === 'hi';

  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange({
            lat: Math.round(pos.coords.latitude * 100) / 100,
            lon: Math.round(pos.coords.longitude * 100) / 100,
            name: isHi ? 'वर्तमान स्थान' : 'Current Location',
          });
        },
        () => {
          // Fallback to Delhi NCR silently
          onChange({ lat: 28.61, lon: 77.21, name: 'Delhi NCR' });
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="loc-name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
          {isHi ? 'स्थान / शहर' : 'City or Locality'}
        </label>
        <div className="flex gap-2">
          <input
            id="loc-name"
            type="text"
            value={location.name ?? 'Delhi NCR'}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            className="w-full rounded-control border border-line/40 bg-surface/90 px-3 py-2 text-xs sm:text-sm text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20 transition-all shadow-xs"
            placeholder="e.g. Delhi NCR, Noida, Anand Vihar"
          />
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-control border border-line/40 bg-surface/90 hover:bg-haze px-3 py-2 text-xs font-semibold text-ink transition-all active:scale-[0.98] shadow-xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
            <span>{isHi ? 'जीपीएस स्थान' : 'Use GPS'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
        <div>
          <label htmlFor="loc-lat" className="block font-medium text-[11px] mb-1">
            {isHi ? 'अक्षांश (Lat)' : 'Latitude'}
          </label>
          <input
            id="loc-lat"
            type="number"
            step="0.01"
            value={location.lat}
            onChange={(e) => onChange({ ...location, lat: parseFloat(e.target.value) || 28.61 })}
            className="w-full rounded-control border border-line/40 bg-surface/90 px-2.5 py-1.5 text-xs text-ink tabular-nums shadow-xs focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
          />
        </div>
        <div>
          <label htmlFor="loc-lon" className="block font-medium text-[11px] mb-1">
            {isHi ? 'देशांतर (Lon)' : 'Longitude'}
          </label>
          <input
            id="loc-lon"
            type="number"
            step="0.01"
            value={location.lon}
            onChange={(e) => onChange({ ...location, lon: parseFloat(e.target.value) || 77.21 })}
            className="w-full rounded-control border border-line/40 bg-surface/90 px-2.5 py-1.5 text-xs text-ink tabular-nums shadow-xs focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
          />
        </div>
      </div>
    </div>
  );
}
