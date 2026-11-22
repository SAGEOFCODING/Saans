'use client';

import React, { useState } from 'react';

interface IndoorSanctuaryCardProps {
  lang?: 'en' | 'hi';
}

interface RoomReading {
  nameEn: string;
  nameHi: string;
  aqi: number;
  pm25: number;
  statusEn: string;
  statusHi: string;
  color: string;
}

const ROOMS: RoomReading[] = [
  { nameEn: 'Master Bedroom', nameHi: 'शयनकक्ष', aqi: 24, pm25: 12, statusEn: 'Sealed & HEPA On', statusHi: 'सील व HEPA चालू', color: '#006e2e' },
  { nameEn: "Kid's Room", nameHi: 'बच्चों का कमरा', aqi: 22, pm25: 10, statusEn: 'Sealed & HEPA On', statusHi: 'सील व HEPA चालू', color: '#006e2e' },
  { nameEn: 'Living Room', nameHi: 'बैठक कक्ष', aqi: 38, pm25: 18, statusEn: 'Purifier Auto Turbo', statusHi: 'ऑटो टर्बो पर', color: '#006e2e' },
  { nameEn: 'Kitchen / Balcony', nameHi: 'रसोई / बालकनी', aqi: 210, pm25: 140, statusEn: 'Chimney Running', statusHi: 'चिमनी चालू', color: '#E8730C' },
];

export function IndoorSanctuaryCard({ lang = 'en' }: IndoorSanctuaryCardProps) {
  const isHi = lang === 'hi';
  const [showRooms, setShowRooms] = useState(false);

  return (
    <section
      id="indoor-sanctuary"
      aria-label={isHi ? 'इनडोर शेल्टर स्थिति' : 'Indoor Sanctuary Status'}
      className="rounded-xl bg-surface/90 backdrop-blur-md border border-line/30 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3 transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Circular Progress Gauge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                className="text-surface-container"
                cx="28"
                cy="28"
                fill="none"
                r="23"
                stroke="currentColor"
                strokeWidth="5"
              />
              <circle
                className="text-secondary transition-all duration-700"
                cx="28"
                cy="28"
                fill="none"
                r="23"
                stroke="currentColor"
                strokeDasharray="144.5"
                strokeDashoffset="14"
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <span className="absolute font-mono font-extrabold text-sm text-on-surface tabular-nums">
              24
            </span>
          </div>

          {/* Oasis Metadata */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                {isHi ? 'स्वच्छ इनडोर वातावरण' : 'Clean Oasis'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface font-display truncate">
              {isHi ? 'बेडरूम AQI: 24 (अच्छा)' : 'Bedroom AQI: 24 (Good)'}
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              {isHi
                ? 'HEPA फ़िल्टर स्वास्थ्य: 91% • कमरे सील हैं'
                : 'HEPA Filter Health: 91% • Sealed'}
            </p>
          </div>
        </div>

        {/* Toggle Rooms Button */}
        <button
          type="button"
          onClick={() => setShowRooms((prev) => !prev)}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-line/30 text-primary text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
          aria-expanded={showRooms}
        >
          <span>{isHi ? 'सभी कमरे' : 'Rooms'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${showRooms ? 'rotate-90' : ''}`}
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Expandable Multi-Room Breakdown */}
      {showRooms && (
        <div className="mt-2 pt-3 border-t border-line/20 space-y-2 animate-fadeIn">
          <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
            {isHi ? 'कमरे-वार इनडोर एयर मॉनिटरिंग:' : 'Room-by-Room Telemetry:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ROOMS.map((r) => (
              <div
                key={r.nameEn}
                className="p-2.5 rounded-lg bg-surface-container-low/80 border border-line/30 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-on-surface text-xs">
                    {isHi ? r.nameHi : r.nameEn}
                  </div>
                  <div className="text-[10px] text-on-surface-variant">{isHi ? r.statusHi : r.statusEn}</div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-surface"
                    style={{ backgroundColor: r.color }}
                  >
                    AQI {r.aqi}
                  </span>
                  <div className="text-[10px] font-mono text-on-surface-variant tabular-nums mt-0.5">
                    {r.pm25} µg/m³
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
