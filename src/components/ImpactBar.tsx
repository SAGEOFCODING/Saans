import React from 'react';

interface ImpactBarProps {
  baseline: number;
  planned: number;
  targetMember?: string;
  co2eSavedKg?: number;
  lang?: 'en' | 'hi';
}

export function ImpactBar({ baseline, planned, targetMember, co2eSavedKg = 0, lang = 'en' }: ImpactBarProps) {
  const isHi = lang === 'hi';
  const maxVal = Math.max(baseline, planned, 100);
  const baselinePct = Math.min(100, Math.round((baseline / maxVal) * 100));
  const plannedPct = Math.min(100, Math.round((planned / maxVal) * 100));
  const deltaPct = baseline > 0 ? Math.max(0, Math.round(((baseline - planned) / baseline) * 100)) : 0;
  const carTrips = co2eSavedKg > 0 ? Math.round(co2eSavedKg / 1.7) : 0;

  return (
    <section
      aria-label="Exposure Reduction Impact"
      className="rounded-panel border border-line/70 bg-surface/95 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5 transition-all"
    >
      <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight">
            {isHi ? 'अनुमानित प्रदूषक जोखिम में कमी' : 'Exposure Reduction Impact'}
          </h3>
          <p className="text-[11px] text-ink-muted">
            {isHi ? 'दैनिक सूक्ष्म-पर्यावरण जोखिम सूचकांक' : 'Daily microenvironment exposure index'}
          </p>
        </div>
        <span className="rounded-chip bg-gain/10 border border-gain/30 px-2.5 py-0.5 text-xs font-bold text-gain shadow-xs">
          ↓ {deltaPct}% {isHi ? 'कम' : 'lower'}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Baseline Bar */}
        <div>
          <div className="flex justify-between text-ink-muted mb-1 text-[11px]">
            <span>{isHi ? 'वर्तमान स्तर (बिना उपाय):' : 'Baseline Exposure:'}</span>
            <span className="font-semibold tabular-nums text-ink">{baseline}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-haze overflow-hidden">
            <div
              className="h-full rounded-full bg-ink-muted/40 transition-all duration-300"
              style={{ width: `${baselinePct}%` }}
              role="progressbar"
              aria-valuenow={baseline}
              aria-valuemin={0}
              aria-valuemax={maxVal}
              aria-label="Baseline exposure level"
            />
          </div>
        </div>

        {/* Planned Bar */}
        <div>
          <div className="flex justify-between text-ink-muted mb-1 text-[11px]">
            <span className="font-medium text-gain">
              {isHi ? 'योजना के साथ:' : 'With Clean-Air Plan:'}
            </span>
            <span className="font-bold tabular-nums text-gain">{planned}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-haze overflow-hidden">
            <div
              className="h-full rounded-full bg-gain transition-all duration-300"
              style={{ width: `${plannedPct}%` }}
              role="progressbar"
              aria-valuenow={planned}
              aria-valuemin={0}
              aria-valuemax={maxVal}
              aria-label="Planned exposure level"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed font-normal">
        {isHi
          ? `अनुमानित जोखिम ${baseline} से घटकर ${planned} (लगभग ${deltaPct}% की कमी)। अनुमान, मध्यम विश्वसनीयता।`
          : `Estimated exposure ${baseline} → ${planned} (${deltaPct}% lower${targetMember ? ` for ${targetMember}` : ''}). Estimate, medium confidence.`}
      </p>

      {co2eSavedKg > 0 && (
        <div className="border-t border-line/40 pt-2.5 text-xs text-ink-muted flex items-center justify-between">
          <span className="font-medium">{isHi ? 'सामूहिक CO₂e बचत:' : 'CO₂e saved today:'}</span>
          <span className="font-bold text-gain tabular-nums">
            {co2eSavedKg} kg {carTrips > 0 ? `(≈ ${carTrips} car trips)` : ''}
          </span>
        </div>
      )}
    </section>
  );
}
