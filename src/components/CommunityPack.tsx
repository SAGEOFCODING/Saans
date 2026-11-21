'use client';

import React, { useState } from 'react';
import { scaleCommunityImpact } from '@/domain/impact';
import { CopyIcon, CheckIcon } from './Icons';

interface CommunityPackProps {
  initialHouseholds?: number;
  lang?: 'en' | 'hi';
}

export function CommunityPack({ initialHouseholds = 120, lang = 'en' }: CommunityPackProps) {
  const [households, setHouseholds] = useState(initialHouseholds);
  const [adoptionRate, setAdoptionRate] = useState(0.5); // 50%
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState(false);
  const isHi = lang === 'hi';

  const impact = scaleCommunityImpact(households, adoptionRate, 1.75, days);
  const carTrips = impact.petrolCarTripsSaved;

  const noticeText = isHi
    ? `[आरडब्ल्यूए स्वच्छ-वायु संकल्प]\nप्रिय पड़ोसियों, इस स्मॉग सीजन में हमारे अपार्टमेंट परिसर (${households} परिवार) ने स्वच्छ-वायु पहल शुरू की है:\n1. कचरा व सूखी पत्तियां जलाने पर पूर्ण रोक\n2. रात्रि सुरक्षा गार्डों को इलेक्ट्रिक हीटर की सुविधा\n3. धूल नियंत्रण के लिए सड़कों पर पानी का छिड़काव\n4. जनरेटर फिल्टर सर्विसिंग\nसामूहिक प्रभाव: 30 दिनों में ${impact.collectiveCO2eKg} कि.ग्रा. CO₂e की बचत!`
    : `[RWA Clean-Air Advisory]\nDear Residents, during severe winter smog, our society (${households} homes) has adopted shared clean-air guidelines:\n1. Zero leaf/waste burning on premises\n2. Electric room-heaters for night security staff\n3. Water sprinkling on internal driveways for dust suppression\n4. Diesel generator emission servicing\nCollective Impact: ~${impact.collectiveCO2eKg} kg CO₂e saved in ${days} days!`;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(noticeText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <section
      aria-label="Community Clean Air Multiplier"
      className="my-6 rounded-panel border border-line/70 bg-surface/95 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/40 pb-3">
        <div>
          <h3 className="text-base font-bold text-ink tracking-tight">
            {isHi ? 'सामुदायिक प्रभाव व आरडब्ल्यूए पैक' : 'Community Smog Action & RWA Pack'}
          </h3>
          <p className="text-xs text-ink-muted">
            {isHi
              ? 'सोसायटी या अपार्टमेंट परिसर में सामूहिक प्रयास का प्रभाव देखें'
              : 'Scale collective action across your apartment society or neighborhood'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-control border border-line bg-surface hover:bg-haze px-3 py-1.5 text-xs font-semibold text-ink transition-all active:scale-[0.98] shadow-xs"
          aria-label="Copy RWA Notice Text"
        >
          {copied ? <CheckIcon size={14} className="text-gain" /> : <CopyIcon size={14} />}
          <span>{copied ? (isHi ? 'कॉपी हो गया!' : 'Copied!') : (isHi ? 'नोटिस कॉपी करें' : 'Copy Notice')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div>
          <label htmlFor="comm-households" className="block font-semibold text-ink mb-1.5">
            {isHi ? `सोसायटी फ्लैट्स (${households})` : `Households (${households})`}
          </label>
          <input
            id="comm-households"
            type="range"
            min="10"
            max="500"
            step="10"
            value={households}
            onChange={(e) => setHouseholds(parseInt(e.target.value, 10))}
            className="w-full accent-sky cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="comm-adoption" className="block font-semibold text-ink mb-1.5">
            {isHi ? `सहभागिता (${Math.round(adoptionRate * 100)}%)` : `Adoption (${Math.round(adoptionRate * 100)}%)`}
          </label>
          <input
            id="comm-adoption"
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={adoptionRate}
            onChange={(e) => setAdoptionRate(parseFloat(e.target.value))}
            className="w-full accent-sky cursor-pointer"
          />
        </div>

        <div>
          <label htmlFor="comm-days" className="block font-semibold text-ink mb-1.5">
            {isHi ? `अवधि (${days} दिन)` : `Duration (${days} days)`}
          </label>
          <select
            id="comm-days"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="w-full rounded-control border border-line bg-surface p-1.5 text-ink font-medium"
          >
            <option value="7">7 {isHi ? 'दिन' : 'days'}</option>
            <option value="30">30 {isHi ? 'दिन' : 'days'}</option>
            <option value="60">60 {isHi ? 'दिन' : 'days'}</option>
            <option value="90">90 {isHi ? 'दिन' : 'days'}</option>
          </select>
        </div>
      </div>

      {/* Collective Metric Pill */}
      <div className="rounded-control bg-gain/10 border border-gain/20 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-ink">
          {isHi ? 'सामूहिक CO₂e उत्सर्जन बचत:' : 'Collective CO₂e avoided:'}
        </span>
        <span className="text-sm font-bold text-gain tabular-nums">
          {impact.collectiveCO2eKg} kg CO₂e {carTrips > 0 ? `(≈ ${carTrips} car trips)` : ''}
        </span>
      </div>
    </section>
  );
}
