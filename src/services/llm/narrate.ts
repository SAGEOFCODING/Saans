import { z } from 'zod';
import type { DayPlan, Household, AirCategory } from '../../domain/types';
import { hasSensitiveMember } from '../../domain/risk';
import { generateTemplateNarration } from '../templateNarration';
import { NARRATOR_SYSTEM_PROMPT, formatFactsPrompt } from './prompts';
import { validateNarration } from './guard';
import { getLLMProvider } from './provider';

export const NarrationBlockSchema = z.object({
  id: z.string(),
  intro: z.string().max(150),
});

export const NarrationActionSchema = z.object({
  id: z.string(),
  tip: z.string().max(200),
  whyPlain: z.string().max(250),
});

export const NarrationSchema = z.object({
  headline: z.string().max(120),
  summary: z.string().max(300),
  blocks: z.array(NarrationBlockSchema),
  actions: z.array(NarrationActionSchema),
  watchouts: z.array(z.string().max(200)),
});

export type Narration = z.infer<typeof NarrationSchema>;

export interface Facts {
  air: {
    aqi: number;
    category: AirCategory;
    pm25: number;
    pm10: number;
    stagnant: boolean;
    visibilityKm?: number;
    tempC?: number;
    rh?: number;
    windKmh?: number;
  };
  tiers: Array<{ band?: string; tier: number }>;
  blocks: Array<{
    id: string;
    span?: { start: string; end: string };
    actions: Array<{
      id: string;
      titleEn: string;
      deltaPct?: number;
      co2eKgDay?: number;
      pmTier?: string;
      cost: string;
      effort: number;
    }>;
  }>;
  window?: { best: { start: string; end: string }; worst: { start: string; end: string } };
  civic?: string;
  season?: string;
  lang: 'en' | 'hi';
  sensitiveMember: boolean;
  redFlag: boolean;
  careLine?: string;
}

export function buildFacts(plan: DayPlan, household: Household, lang: 'en' | 'hi' = 'en'): Facts {
  return {
    air: {
      aqi: plan.air.aqi,
      category: plan.air.category,
      pm25: plan.air.pm25,
      pm10: plan.air.pm10,
      stagnant: plan.air.stagnant,
      visibilityKm: plan.air.visibilityKm,
      tempC: plan.air.tempC,
      rh: plan.air.rh,
      windKmh: plan.air.windKmh,
    },
    tiers: (plan.risks || []).map((r) => ({ band: r.band, tier: r.tier })),
    blocks: (plan.blocks || []).map((b) => ({
      id: b.id,
      span: b.span,
      actions: (b.actions || []).map((a) => ({
        id: a.id,
        titleEn: typeof a.title === 'string' ? a.title : a.title?.en || a.id,
        deltaPct: a.impact?.exposureDeltaPct,
        co2eKgDay: a.impact?.co2eKgDay,
        pmTier: a.impact?.pmTier,
        cost: a.cost || 'free',
        effort: a.effort || 1,
      })),
    })),
    window: plan.window ? { best: plan.window.best, worst: plan.window.worst } : undefined,
    civic: plan.civic,
    season: plan.season,
    lang,
    sensitiveMember: hasSensitiveMember(household.members),
    redFlag: false,
  };
}

async function tryNarrateWithRetry(provider: ReturnType<typeof getLLMProvider>, facts: Facts): Promise<Narration | null> {
  try {
    const userPrompt = formatFactsPrompt(facts);
    const res = await provider.json({ system: NARRATOR_SYSTEM_PROMPT, user: userPrompt, schema: NarrationSchema });
    const check1 = validateNarration(res, facts);
    if (check1.valid) return res;

    const retryPrompt = `${userPrompt}\n\nNote: safety rule violation: ${check1.error}. Fix it.`;
    const retryRes = await provider.json({ system: NARRATOR_SYSTEM_PROMPT, user: retryPrompt, schema: NarrationSchema });
    const check2 = validateNarration(retryRes, facts);
    return check2.valid ? retryRes : null;
  } catch {
    return null;
  }
}

export async function narratePlan(
  plan: DayPlan,
  household: Household,
  lang: 'en' | 'hi' = 'en'
): Promise<{ narration: Narration; mode: 'ai' | 'rules' }> {
  const provider = getLLMProvider();
  if (provider.name === 'gemini') {
    const facts = buildFacts(plan, household, lang);
    const aiNarration = await tryNarrateWithRetry(provider, facts);
    if (aiNarration) return { narration: aiNarration, mode: 'ai' };
  }
  return { narration: generateTemplateNarration(plan, lang), mode: 'rules' };
}
