'use client';

import React from 'react';
import type { MobilityProfile } from '@/domain/types';

interface StepMobilityProps {
  mobility: MobilityProfile;
  onChange: (mob: MobilityProfile) => void;
  lang?: 'en' | 'hi';
}

export function StepMobility({ mobility, onChange, lang = 'en' }: StepMobilityProps) {
  const isHi = lang === 'hi';

  const update = <K extends keyof MobilityProfile>(key: K, val: MobilityProfile[K]) => {
    onChange({ ...mobility, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div>
        <label htmlFor="mob-mode" className="block font-semibold text-ink mb-1">
          {isHi ? 'मुख्य आवागमन साधन' : 'Primary Commute Mode'}
        </label>
        <select
          id="mob-mode"
          value={mobility.mode}
          onChange={(e) => update('mode', e.target.value as MobilityProfile['mode'])}
          className="w-full rounded-control border border-line bg-surface p-2 text-ink"
        >
          <option value="metro">{isHi ? 'मेट्रो' : 'Metro Rail'}</option>
          <option value="two-wheeler">{isHi ? 'दोपहिया (बाइक/स्कूटर)' : 'Two-Wheeler (Bike/Scooter)'}</option>
          <option value="bus">{isHi ? 'बस' : 'Public Bus'}</option>
          <option value="auto">{isHi ? 'ऑटो रिक्शा' : 'Auto-Rickshaw'}</option>
          <option value="car-recirc">{isHi ? 'कार (रीसर्कुलेशन ऑन)' : 'Car (Recirculation ON)'}</option>
          <option value="car-open">{isHi ? 'कार (खुली खिड़कियां)' : 'Car (Windows open)'}</option>
          <option value="walk">{isHi ? 'पैदल' : 'Walking'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="mob-distance" className="block font-semibold text-ink mb-1">
          {isHi ? 'दूरी का दायरा' : 'Commute Distance'}
        </label>
        <select
          id="mob-distance"
          value={mobility.distance}
          onChange={(e) => update('distance', e.target.value as MobilityProfile['distance'])}
          className="w-full rounded-control border border-line bg-surface p-2 text-ink"
        >
          <option value="short">{isHi ? 'कम (<5 किमी)' : 'Short (<5 km)'}</option>
          <option value="mid">{isHi ? 'मध्यम (5-15 किमी)' : 'Mid (5-15 km)'}</option>
          <option value="long">{isHi ? 'लंबी (>15 किमी)' : 'Long (>15 km)'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="mob-wfh" className="block font-semibold text-ink mb-1">
          {isHi ? 'घर से काम (WFH दिन/सप्ताह)' : 'Work From Home (Days/week)'}
        </label>
        <input
          id="mob-wfh"
          type="number"
          min="0"
          max="7"
          value={mobility.wfhDays}
          onChange={(e) => update('wfhDays', parseInt(e.target.value, 10) || 0)}
          className="w-full rounded-control border border-line bg-surface p-2 text-ink"
        />
      </div>

      <div className="flex flex-col justify-end space-y-2 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-ink">
          <input
            type="checkbox"
            checked={mobility.exercisesOutdoors}
            onChange={(e) => update('exercisesOutdoors', e.target.checked)}
            className="rounded text-sky focus:ring-sky"
          />
          <span>{isHi ? 'सुबह बाहर टहलना / व्यायाम' : 'Outdoor Morning Walk / Exercise'}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-ink">
          <input
            type="checkbox"
            checked={mobility.schoolAge}
            onChange={(e) => update('schoolAge', e.target.checked)}
            className="rounded text-sky focus:ring-sky"
          />
          <span>{isHi ? 'स्कूल जाने वाले बच्चे हैं' : 'Has School-Going Children'}</span>
        </label>
      </div>
    </div>
  );
}
