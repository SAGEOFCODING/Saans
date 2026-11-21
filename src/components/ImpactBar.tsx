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
      className="rounded-panel border border-line bg-surface p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">
          {isHi ? 'अनुमानित प्रदूषक जोखिम में कमी' : 'Exposure Reduction Impact'}
        </h3>
        <span className="text-xs font-bold text-gain">
          ↓ {deltaPct}% {isHi ? 'कम' : 'lower'}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Baseline Bar */}
        <div>
          <div className="flex justify-between text-ink-muted mb-1">
            <span>{isHi ? 'वर्तमान स्तर (बिना उपाय):' : 'Baseline Exposure:'}</span>
            <span className="font-semibold tabular-nums text-ink">{baseline}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-haze overflow-hidden">
            <div
              className="h-full rounded-full bg-ink-muted/50 transition-all duration-300"
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
          <div className="flex justify-between text-ink-muted mb-1">
            <span className="font-medium text-gain">
              {isHi ? 'योजना के साथ:' : 'With Clean-Air Plan:'}
            </span>
            <span className="font-bold tabular-nums text-gain">{planned}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-haze overflow-hidden">
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

      <p className="text-xs text-ink-muted leading-relaxed">
        {isHi
          ? `अनुमानित जोखिम ${baseline} से घटकर ${planned} (लगभग ${deltaPct}% की कमी)। अनुमान, मध्यम विश्वसनीयता।`
          : `Estimated exposure ${baseline} → ${planned} (${deltaPct}% lower${targetMember ? ` for ${targetMember}` : ''}). Estimate, medium confidence.`}
      </p>

      {co2eSavedKg > 0 && (
        <div className="border-t border-line/60 pt-2 text-xs text-ink-muted flex items-center justify-between">
          <span>{isHi ? 'सामूहिक CO₂e बचत:' : 'CO₂e saved today:'}</span>
          <span className="font-semibold text-gain">
            {co2eSavedKg} kg {carTrips > 0 ? `(≈ ${carTrips} car trips)` : ''}
          </span>
        </div>
      )}
    </section>
  );
}
