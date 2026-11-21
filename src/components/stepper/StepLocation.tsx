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
        <label htmlFor="loc-name" className="block text-sm font-semibold text-ink">
          {isHi ? 'स्थान / शहर' : 'City or Locality'}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="loc-name"
            type="text"
            value={location.name ?? 'Delhi NCR'}
            onChange={(e) => onChange({ ...location, name: e.target.value })}
            className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky"
            placeholder="e.g. Delhi NCR, Noida, Anand Vihar"
          />
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="shrink-0 rounded-control border border-line bg-haze px-3 py-2 text-xs font-semibold text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-sky"
          >
            {isHi ? 'जीपीएस स्थान' : 'Use GPS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
        <div>
          <label htmlFor="loc-lat" className="block font-medium">
            {isHi ? 'अक्षांश (Lat)' : 'Latitude'}
          </label>
          <input
            id="loc-lat"
            type="number"
            step="0.01"
            value={location.lat}
            onChange={(e) => onChange({ ...location, lat: parseFloat(e.target.value) || 28.61 })}
            className="mt-1 w-full rounded-control border border-line bg-surface px-2 py-1 text-ink"
          />
        </div>
        <div>
          <label htmlFor="loc-lon" className="block font-medium">
            {isHi ? 'देशांतर (Lon)' : 'Longitude'}
          </label>
          <input
            id="loc-lon"
            type="number"
            step="0.01"
            value={location.lon}
            onChange={(e) => onChange({ ...location, lon: parseFloat(e.target.value) || 77.21 })}
            className="mt-1 w-full rounded-control border border-line bg-surface px-2 py-1 text-ink"
          />
        </div>
      </div>
    </div>
  );
}
