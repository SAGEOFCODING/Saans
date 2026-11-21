import React from 'react';
import type { MemberRisk, Member } from '@/domain/types';
import { CategoryIcon } from './CategoryIcon';

interface RiskSummaryProps {
  risks: MemberRisk[];
  members: Member[];
  lang?: 'en' | 'hi';
}

const TIER_DESCRIPTIONS: Record<number, { en: string; hi: string; nameEn: string; nameHi: string }> = {
  0: { en: 'Air quality is good. Normal outdoor activity poses no risk.', hi: 'हवा स्वच्छ है। सामान्य गतिविधियों में कोई जोखिम नहीं।', nameEn: 'Good', nameHi: 'अच्छा' },
  1: { en: 'Air quality is satisfactory. Sensitive members observe minor effects.', hi: 'हवा संतोषजनक है। संवेदनशील व्यक्ति हल्के प्रभाव देख सकते हैं।', nameEn: 'Satisfactory', nameHi: 'संतोषजनक' },
  2: { en: 'Moderate air. Sensitive members should reduce prolonged outdoor exertion.', hi: 'मध्यम हवा। संवेदनशील सदस्यों को बाहर भारी मेहनत कम करनी चाहिए।', nameEn: 'Moderate', nameHi: 'मध्यम' },
  3: { en: 'Poor air. Limit outdoor exposure; close windows during peak smog.', hi: 'खराब हवा। बाहर जाने से बचें और खिड़कियां बंद रखें।', nameEn: 'Poor', nameHi: 'खराब' },
  4: { en: 'Very poor air. Avoid outdoor exertion; use indoor filtration and fitted N95.', hi: 'बहुत खराब हवा। बाहर न निकलें; N95 मास्क और प्यूरीफायर का प्रयोग करें।', nameEn: 'Very Poor', nameHi: 'बहुत खराब' },
  5: { en: 'Severe smog emergency. Remain indoors with continuous air cleaning.', hi: 'गंभीर स्मॉग आपातकाल। घर के अंदर रहें और लगातार प्यूरीफायर चलाएं।', nameEn: 'Severe', nameHi: 'गंभीर' },
};

const BAND_NAMES: Record<string, { en: string; hi: string }> = {
  infant: { en: 'Infant (<1 yr)', hi: 'शिशु (<1 वर्ष)' },
  child: { en: 'Child', hi: 'बच्चा' },
  adult: { en: 'Adult', hi: 'वयस्क' },
  senior: { en: 'Senior (60+ yrs)', hi: 'वरिष्ठ नागरिक' },
};

export function RiskSummary({ risks, members, lang = 'en' }: RiskSummaryProps) {
  const isHi = lang === 'hi';

  if (!risks || risks.length === 0) return null;

  return (
    <section aria-label="Household Risk Assessment" className="my-5 space-y-3">
      <h3 className="text-base font-bold text-ink">
        {isHi ? 'सदस्य संवेदनशीलता और जोखिम स्तर' : 'Household Member Vulnerability'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {risks.map((risk, index) => {
          const member = members[index];
          const band = risk.band ?? member?.band ?? 'adult';
          const bandInfo = BAND_NAMES[band] ?? { en: band, hi: band };
          const tierMeta = TIER_DESCRIPTIONS[risk.tier] ?? TIER_DESCRIPTIONS[3];

          return (
            <div
              key={index}
              className="risk-card rounded-control border border-line bg-surface p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-sm text-ink">
                  {isHi ? bandInfo.hi : bandInfo.en}
                  {member?.sensitive && (
                    <span className="ml-1.5 rounded-chip bg-caution/15 px-1.5 py-0.5 text-[11px] font-semibold text-caution">
                      {isHi ? 'संवेदनशील' : 'Sensitive'}
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 rounded-chip bg-haze px-2 py-0.5 text-xs font-bold text-ink">
                  <CategoryIcon tier={risk.tier} size={11} />
                  Tier {risk.tier} · {isHi ? tierMeta.nameHi : tierMeta.nameEn}
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {risk.message ? risk.message : (isHi ? tierMeta.hi : tierMeta.en)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
