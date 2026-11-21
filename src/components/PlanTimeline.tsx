'use client';

import React from 'react';
import type { Block } from '@/domain/types';
import { ActionItem } from './ActionItem';

interface PlanTimelineProps {
  blocks: Block[];
  activeActionIds?: string[];
  onToggleAction?: (actionId: string, doing: boolean) => void;
  lang?: 'en' | 'hi';
}

const BLOCK_LABELS: Record<string, { en: string; hi: string }> = {
  'night-sleep': { en: 'Overnight Sleep (22:00 – 06:00)', hi: 'रात की नींद (22:00 – 06:00)' },
  'morning-routine': { en: 'Early Morning Routine (06:00 – 09:00)', hi: 'प्रातःकाल (06:00 – 09:00)' },
  'commute-morning': { en: 'Morning Commute (09:00 – 10:30)', hi: 'सुबह का आवागमन (09:00 – 10:30)' },
  'daytime': { en: 'Daytime Work / Home (10:30 – 17:30)', hi: 'दिन का समय (10:30 – 17:30)' },
  'commute-evening': { en: 'Evening Commute (17:30 – 19:00)', hi: 'शाम का आवागमन (17:30 – 19:00)' },
  'evening-routine': { en: 'Evening & Cooking (19:00 – 22:00)', hi: 'शाम व रसोई (19:00 – 22:00)' },
};

export function PlanTimeline({ blocks, activeActionIds = [], onToggleAction, lang = 'en' }: PlanTimelineProps) {
  const isHi = lang === 'hi';

  if (!blocks || blocks.length === 0) return null;

  return (
    <section aria-label="Daily Clean Air Schedule" className="my-6 space-y-6">
      <h3 className="text-base font-bold text-ink">
        {isHi ? 'समयबद्ध स्वच्छ-वायु कार्यक्रम' : 'Time-Blocked Clean-Air Routine'}
      </h3>

      <div className="relative border-l-2 border-line/70 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
        {blocks.map((block) => {
          const label = BLOCK_LABELS[block.id] ?? {
            en: `${block.span ? `${block.span.start} - ${block.span.end}` : block.id}`,
            hi: `${block.span ? `${block.span.start} - ${block.span.end}` : block.id}`,
          };

          return (
            <div key={block.id} className="timeline-block relative">
              {/* Timeline spine dot */}
              <div className="absolute -left-[21px] sm:-left-[29px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-sky" />

              <div className="mb-2.5 flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  {isHi ? label.hi : label.en}
                </h4>
                {block.env && (
                  <span className="rounded-chip bg-haze px-2 py-0.5 text-[10px] text-ink-muted">
                    {block.env}
                  </span>
                )}
              </div>

              {block.actions && block.actions.length > 0 ? (
                <div className="space-y-2.5">
                  {block.actions.map((action) => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      isDoing={activeActionIds.includes(action.id)}
                      onToggleDoing={onToggleAction}
                      lang={lang}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-ink-muted/80">
                  {isHi ? 'इस समय कोई विशेष क्रिया आवश्यक नहीं।' : 'Normal routine; no specific air intervention required.'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
