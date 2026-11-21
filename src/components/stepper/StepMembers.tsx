'use client';

import React from 'react';
import type { Member } from '@/domain/types';

interface StepMembersProps {
  members: Member[];
  onChange: (members: Member[]) => void;
  lang?: 'en' | 'hi';
}

const BANDS: Array<{ key: Member['band']; en: string; hi: string }> = [
  { key: 'infant', en: 'Infant (<1 yr)', hi: 'शिशु (<1 वर्ष)' },
  { key: 'child', en: 'Child (1-17 yrs)', hi: 'बच्चा (1-17 वर्ष)' },
  { key: 'adult', en: 'Adult (18-59 yrs)', hi: 'वयस्क (18-59 वर्ष)' },
  { key: 'senior', en: 'Senior (60+ yrs)', hi: 'वरिष्ठ (60+ वर्ष)' },
];

export function StepMembers({ members, onChange, lang = 'en' }: StepMembersProps) {
  const isHi = lang === 'hi';

  const updateMember = (index: number, patch: Partial<Member>) => {
    const next = members.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChange(next);
  };

  const addMember = () => {
    onChange([...members, { band: 'adult' }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink">
          {isHi ? 'परिवार के सदस्य' : 'Household Members'}
        </label>
        <button
          type="button"
          onClick={addMember}
          className="rounded-control bg-sky/10 px-2.5 py-1 text-xs font-semibold text-sky hover:bg-sky/20"
        >
          {isHi ? '+ सदस्य जोड़ें' : '+ Add Member'}
        </button>
      </div>

      <div className="space-y-2">
        {members.map((member, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface p-2.5 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink-muted">#{index + 1}</span>
              <select
                aria-label={`Member ${index + 1} age band`}
                value={member.band}
                onChange={(e) => updateMember(index, { band: e.target.value as Member['band'] })}
                className="rounded-control border border-line bg-surface px-2 py-1 text-ink"
              >
                {BANDS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {isHi ? b.hi : b.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-ink">
                <input
                  type="checkbox"
                  checked={!!member.sensitive}
                  onChange={(e) => updateMember(index, { sensitive: e.target.checked })}
                  className="rounded text-sky focus:ring-sky"
                />
                <span>{isHi ? 'सांस / दमा संवेदनशीलता' : 'Asthma / Sensitivity'}</span>
              </label>

              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="text-danger-text hover:underline"
                  aria-label={`Remove member ${index + 1}`}
                >
                  {isHi ? 'हटाएं' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
