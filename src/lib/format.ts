/**
 * Intl-based formatting helpers for numbers, units, and timestamps.
 * Adheres to docs/design-system.md §11 (units stay as µg/m³, km, kg CO₂e).
 */

export function formatNumber(val: number, lang: 'en' | 'hi' = 'en', decimals = 0): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

export function formatAqi(val: number, lang: 'en' | 'hi' = 'en'): string {
  return formatNumber(Math.round(val), lang);
}

export function formatPm25(val: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(val), lang)} µg/m³`;
}

export function formatPm10(val: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(val), lang)} µg/m³`;
}

export function formatVisibility(km?: number, lang: 'en' | 'hi' = 'en'): string {
  if (km === undefined || km === null || Number.isNaN(km)) {
    return lang === 'hi' ? 'दृश्यता सीमित' : 'Visibility limited';
  }
  const formatted = formatNumber(km, lang, 1);
  return lang === 'hi' ? `लगभग ${formatted} किमी दृश्यता` : `You can see about ${formatted} km`;
}

export function formatWind(kmh: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(kmh), lang)} km/h`;
}

export function formatTemp(c: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(c), lang)}°C`;
}

export function formatHumidity(rh: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(rh), lang)}%`;
}

export function formatPercent(val: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(Math.round(val), lang)}%`;
}

export function formatCo2e(kg: number, lang: 'en' | 'hi' = 'en'): string {
  return `${formatNumber(kg, lang, 1)} kg CO₂e`;
}

export function formatTimeSpan(span: { start: string; end: string }): string {
  return `${span.start} – ${span.end}`;
}
