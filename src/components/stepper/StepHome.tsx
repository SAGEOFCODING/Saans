'use client';

import React from 'react';
import type { HomeProfile } from '@/domain/types';

interface StepHomeProps {
  home: HomeProfile;
  onChange: (home: HomeProfile) => void;
  lang?: 'en' | 'hi';
}

export function StepHome({ home, onChange, lang = 'en' }: StepHomeProps) {
  const isHi = lang === 'hi';

  const update = <K extends keyof HomeProfile>(key: K, val: HomeProfile[K]) => {
    onChange({ ...home, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div>
        <label htmlFor="home-type" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isHi ? 'घर का प्रकार' : 'Housing Type'}
        </label>
        <select
          id="home-type"
          value={home.type}
          onChange={(e) => update('type', e.target.value as HomeProfile['type'])}
          className="w-full rounded-control border border-line/70 bg-surface p-2 text-xs font-medium text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky/30 shadow-xs"
        >
          <option value="apartment">{isHi ? 'अपार्टमेंट / फ्लैट' : 'Apartment / Flat'}</option>
          <option value="house">{isHi ? 'स्वतंत्र मकान' : 'Independent House'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="home-floor" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isHi ? 'मंजिल स्तर' : 'Floor Level'}
        </label>
        <select
          id="home-floor"
          value={home.floor}
          onChange={(e) => update('floor', e.target.value as HomeProfile['floor'])}
          className="w-full rounded-control border border-line/70 bg-surface p-2 text-xs font-medium text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky/30 shadow-xs"
        >
          <option value="low">{isHi ? 'निचली (भू/1)' : 'Low (Ground/1st)'}</option>
          <option value="mid">{isHi ? 'मध्यम (2-6)' : 'Mid (2nd-6th)'}</option>
          <option value="high">{isHi ? 'ऊंची (7+)' : 'High (7th+)'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="home-windows" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isHi ? 'खिड़कियों की बनावट' : 'Window Drafts'}
        </label>
        <select
          id="home-windows"
          value={home.windows}
          onChange={(e) => update('windows', e.target.value as HomeProfile['windows'])}
          className="w-full rounded-control border border-line/70 bg-surface p-2 text-xs font-medium text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky/30 shadow-xs"
        >
          <option value="leaky">{isHi ? 'हवा रिसती है (ड्राफ्ट)' : 'Leaky / Noticeable Drafts'}</option>
          <option value="tight">{isHi ? 'सील बंद (टाइट)' : 'Tight / Weather-Sealed'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="home-purifier" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isHi ? 'एयर प्यूरीफायर' : 'Air Purifier'}
        </label>
        <select
          id="home-purifier"
          value={home.purifier}
          onChange={(e) => update('purifier', e.target.value as HomeProfile['purifier'])}
          className="w-full rounded-control border border-line/70 bg-surface p-2 text-xs font-medium text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky/30 shadow-xs"
        >
          <option value="none">{isHi ? 'कोई नहीं' : 'None'}</option>
          <option value="bedroom">{isHi ? 'बेडरूम में' : 'Bedroom only'}</option>
          <option value="living">{isHi ? 'लिविंग रूम में' : 'Living room only'}</option>
          <option value="both">{isHi ? 'दोनों कमरों में' : 'Both rooms'}</option>
        </select>
      </div>

      <div>
        <label htmlFor="home-cooking" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
          {isHi ? 'रसोई ईंधन' : 'Cooking Fuel'}
        </label>
        <select
          id="home-cooking"
          value={home.cooking}
          onChange={(e) => update('cooking', e.target.value as HomeProfile['cooking'])}
          className="w-full rounded-control border border-line/70 bg-surface p-2 text-xs font-medium text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky/30 shadow-xs"
        >
          <option value="png">PNG (Piped Natural Gas)</option>
          <option value="lpg">LPG Cylinder</option>
          <option value="induction">{isHi ? 'इंडक्शन / बिजली' : 'Induction / Electric'}</option>
          <option value="biomass">{isHi ? 'लकड़ी / बायोमास' : 'Biomass / Wood'}</option>
        </select>
      </div>

      <div className="flex flex-col justify-end">
        <label className="flex items-center gap-2 cursor-pointer text-ink font-medium select-none p-2 rounded-control border border-line/50 hover:bg-haze/30">
          <input
            type="checkbox"
            checked={home.chimney}
            onChange={(e) => update('chimney', e.target.checked)}
            className="rounded border-line text-sky focus:ring-sky/30"
          />
          <span className="text-xs">{isHi ? 'रसोई चिमनी / एग्जॉस्ट लगा है' : 'Kitchen Chimney / Exhaust installed'}</span>
        </label>
      </div>
    </div>
  );
}
