import stringsEn from '../data/strings.en.json';
import stringsHi from '../data/strings.hi.json';
import type { DayPlan, AirCategory } from '../domain/types';

export interface NarrationBlock {
  id: string;
  intro: string;
}

export interface NarrationAction {
  id: string;
  tip: string;
  whyPlain: string;
}

export interface Narration {
  headline: string;
  summary: string;
  blocks: NarrationBlock[];
  actions: NarrationAction[];
  watchouts: string[];
}

const HEADLINE_KEYS: Record<AirCategory, keyof typeof stringsEn.templateNarration> = {
  good: 'headlineGood',
  satisfactory: 'headlineSatisfactory',
  moderate: 'headlineModerate',
  poor: 'headlinePoor',
  'very-poor': 'headlineVeryPoor',
  severe: 'headlineSevere',
};

function resolveString(item: unknown, lang: 'en' | 'hi', fallback: string): string {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    const dict = item as Record<string, string>;
    return dict[lang] || dict['en'] || fallback;
  }
  return fallback;
}

export function generateTemplateNarration(plan: DayPlan, lang: 'en' | 'hi' = 'en'): Narration {
  const s = lang === 'hi' ? stringsHi : stringsEn;
  const headlineKey = HEADLINE_KEYS[plan.air.category] || 'headlineModerate';
  const headline = String(s.templateNarration[headlineKey]);

  const catName = (s.categories as Record<string, string>)[plan.air.category] || plan.air.category;
  let summary = `${s.templateNarration.summaryPrefix} ${catName}.`;

  if (plan.baseline !== undefined && plan.planned !== undefined && plan.baseline > plan.planned) {
    const pct = Math.round(((plan.baseline - plan.planned) / plan.baseline) * 100);
    summary += ` ${s.templateNarration.summaryReduction} ${pct}%.`;
  }

  const blocks: NarrationBlock[] = (plan.blocks || []).map((b) => ({
    id: b.id,
    intro: lang === 'hi' ? `${b.id.replace(/-/g, ' ')} सुझाव` : `${b.id.replace(/-/g, ' ')} recommendations`,
  }));

  const actions: NarrationAction[] = [];
  for (const b of plan.blocks || []) {
    for (const a of b.actions || []) {
      const tip = resolveString(a.title, lang, a.id);
      const whyPlain = resolveString(a.why, lang, '');
      actions.push({ id: a.id, tip, whyPlain });
    }
  }

  const watchouts: string[] = [];
  if (plan.air.stagnant) {
    watchouts.push(
      lang === 'hi'
        ? 'हवा रुकी हुई है, वेंटिलेशन सावधानी से करें।'
        : 'Atmospheric stagnation detected: still, cold air traps smoke near ground level.'
    );
  }
  if (plan.civic) {
    watchouts.push(plan.civic);
  }

  return { headline, summary, blocks, actions, watchouts };
}
