'use client';

import React, { useState } from 'react';
import regionsData from '@/data/regions.json';

interface GrapViewProps {
  isHi: boolean;
  effectiveAqi: number;
}

export function GrapView({ isHi, effectiveAqi }: GrapViewProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const activeGrapStage = regionsData.grapStages.find(
    (s) => effectiveAqi >= s.aqiMin && effectiveAqi <= s.aqiMax
  ) || (effectiveAqi > 450 ? regionsData.grapStages[regionsData.grapStages.length - 1] : null);

  return (
    <div className="space-y-3.5">
      <div className="rounded-control bg-sky/10 border border-sky/25 p-3 text-xs flex items-center justify-between gap-3">
        <div>
          <span className="font-bold text-sky">
            {isHi ? 'वर्तमान GRAP सक्रियता स्तर:' : 'Current Delhi-NCR GRAP Stage:'}
          </span>{' '}
          <span className="font-bold text-ink">
            {activeGrapStage ? activeGrapStage.name : isHi ? 'सामान्य (AQI ≤ 200)' : 'Normal (AQI ≤ 200)'}
          </span>
          <p className="text-[11px] text-ink-muted mt-0.5">
            {isHi
              ? 'ग्रेडेड रिस्पांस एक्शन प्लान (GRAP) सीएक्यूएम द्वारा दिल्ली-एनसीआर में प्रदूषण नियंत्रित करने हेतु कानूनी रूप से लागू किया जाता है।'
              : 'Graded Response Action Plan (GRAP) is statutorily enforced across Delhi-NCR by CAQM based on ambient AQI.'}
          </p>
        </div>
        <span className="rounded-chip bg-surface border border-sky/30 px-3 py-1 font-mono font-bold text-sky text-xs shrink-0">
          AQI {effectiveAqi}
        </span>
      </div>

      <div className="space-y-2">
        {regionsData.grapStages.map((stage) => {
          const isCurrent = activeGrapStage?.stage === stage.stage;
          const isExpanded = expandedStage === stage.stage || (expandedStage === null && isCurrent);

          return (
            <div
              key={stage.stage}
              className={`rounded-control border transition-all ${
                isCurrent
                  ? 'border-caution bg-caution/5 shadow-xs ring-1 ring-caution/30'
                  : 'border-line/40 bg-surface/80 hover:bg-haze/40'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedStage(isExpanded ? 0 : stage.stage)}
                className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent ? 'bg-caution text-surface' : 'bg-haze text-ink-muted border border-line/40'
                    }`}
                  >
                    {stage.stage}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink text-xs">{stage.name}</h4>
                      {isCurrent && (
                        <span className="rounded-chip bg-caution/20 text-caution border border-caution/30 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                          {isHi ? 'सक्रिय' : 'Active Now'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-ink-muted font-mono">AQI {stage.aqiMin} – {stage.aqiMax}</span>
                  </div>
                </div>
                <span className="text-ink-muted text-xs font-semibold">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-line/20 space-y-2">
                  <div>
                    <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                      {isHi ? 'लागू किए जाने वाले प्रतिबंध:' : 'Enforced Restrictions & Mandates:'}
                    </span>
                    <p className="text-ink/90 text-xs mt-0.5 leading-relaxed">{stage.summary}</p>
                  </div>
                  <div className="rounded-control bg-haze/50 p-2 text-[11px] text-ink-muted flex items-start gap-1.5">
                    <span className="text-sky font-bold">ℹ️</span>
                    <span>{stage.hint}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
