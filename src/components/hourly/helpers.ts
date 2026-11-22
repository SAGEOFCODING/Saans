import type { HourlyPoint, Span } from '@/domain/types';
import { getAQICategory } from '@/domain/aqi';

export function isBestHour(timeStr: string, bestWindow?: Span): boolean {
  if (!bestWindow) return false;
  const cleanT = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
  return cleanT >= bestWindow.start && cleanT <= bestWindow.end;
}

export function isWorstHour(timeStr: string, worstWindow?: Span): boolean {
  if (!worstWindow) return false;
  const cleanT = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
  return cleanT >= worstWindow.start && cleanT <= worstWindow.end;
}

export function formatHourLabel(t: string): string {
  let hStr = t;
  if (t.includes('T')) hStr = t.split('T')[1];
  const hour = parseInt(hStr.split(':')[0], 10);
  if (isNaN(hour)) return '';
  const ampm = hour >= 12 ? 'p' : 'a';
  const h12 = hour % 12 || 12;
  return `${h12}${ampm}`;
}

export function formatFullTime(t: string): string {
  let hStr = t;
  if (t.includes('T')) hStr = t.split('T')[1];
  const parts = hStr.split(':');
  const hour = parseInt(parts[0], 10);
  const mins = parts[1]?.slice(0, 2) || '00';
  if (isNaN(hour)) return t;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${parts[0]}:${mins} (${h12}:${mins} ${ampm})`;
}

export function getHourGuidance(pt: HourlyPoint, isHi: boolean, bestWindow?: Span, worstWindow?: Span): string {
  const inBest = isBestHour(pt.t, bestWindow);
  const inWorst = isWorstHour(pt.t, worstWindow);
  const cat = getAQICategory(pt.aqi);

  if (inBest) {
    return isHi
      ? '★ दिन का सबसे स्वच्छ समय: कमरे में ताजी हवा आने दें या जरूरी बाहरी कार्य निपटाएं।'
      : '★ Cleanest window today: Best time for natural room airing or quick errands.';
  }
  if (inWorst) {
    return isHi
      ? '▲ उच्चतम प्रदूषण का दौर: खिड़कियां बंद रखें, प्यूरीफायर चलाएं और बाहर जाने से बचें।'
      : '▲ Peak smog period: Seal windows, run purifiers on boost, avoid outdoor exertion.';
  }
  if (cat === 'good' || cat === 'satisfactory') {
    return isHi
      ? 'संतोषजनक वायु: सामान्य दिनचर्या व बाहरी गतिविधियां सुरक्षित हैं।'
      : 'Acceptable air: Safe for routine daily outdoor activities.';
  }
  if (cat === 'moderate') {
    return isHi
      ? 'मध्यम प्रदूषण: संवेदनशील लोग लंबे समय तक भारी व्यायाम से बचें।'
      : 'Moderate air: Sensitive members should avoid prolonged heavy exertion.';
  }
  if (cat === 'poor') {
    return isHi
      ? 'खराब वायु: बाहरी शारीरिक व्यायाम सीमित करें; बाहर निकलते समय N95 मास्क पहनें।'
      : 'Poor air: Limit strenuous outdoor exercise; wear a fitted N95 mask outdoors.';
  }
  return isHi
    ? 'अति-गंभीर प्रदूषण: खिड़कियां पूरी तरह बंद रखें और इनडोर एयर प्यूरीफायर चालू रखें।'
    : 'Severe smog: Stay indoors with HEPA air filtration running; avoid outdoor exposure.';
}
