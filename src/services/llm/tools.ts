import type { Air, Household, DayPlan, ActionModifier } from '../../domain/types';
import { getBestWindowForActivity } from '../../domain/window';
import { generateScheduleBlocks } from '../../domain/schedule';
import { calculateDailyExposure, applyModifiers } from '../../domain/exposure';
import { assembleDayPlan } from '../../domain/plan';
import actionsData from '../../data/actions.json';
import playbookData from '../../data/playbook.json';

export interface ToolContext {
  air: Air;
  household: Household;
  plan?: DayPlan;
}

export const TOOL_DEFINITIONS = [
  {
    name: 'get_air_now',
    description: 'Get current air quality metrics (AQI, PM2.5, PM10, category, stagnation).',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_best_window',
    description: 'Find cleanest and worst 1-hour outdoor activity windows in next 24 hours.',
    parameters: {
      type: 'object',
      properties: { activity: { type: 'string', enum: ['walk', 'play', 'exercise', 'ventilate'] } },
      required: ['activity'],
    },
  },
  {
    name: 'get_plan_actions',
    description: 'Get recommended clean-air actions for household, optionally filtered by domain.',
    parameters: {
      type: 'object',
      properties: { domain: { type: 'string', enum: ['indoor', 'commute', 'cooking', 'heating', 'community', 'habit'] } },
    },
  },
  {
    name: 'simulate',
    description: 'Simulate household exposure reduction (%) for modifier changes.',
    parameters: {
      type: 'object',
      properties: { changes: { type: 'array', items: { type: 'string' } } },
      required: ['changes'],
    },
  },
  {
    name: 'lookup_playbook',
    description: 'Retrieve vetted clean-air guidance snippets and scientific myth-busters.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['ventilation', 'purifier_sizing', 'mask_fit', 'cooking_chimney', 'houseplants_myth', 'steam_myth', 'cloth_masks_myth', 'diy_filter', 'generators'],
        },
      },
      required: ['topic'],
    },
  },
];

export function toolGetAirNow(ctx: ToolContext) {
  const ts = new Date(ctx.air.at).getTime();
  const ageMin = ctx.air.ageMin ?? Math.max(0, Math.floor((Date.now() - ts) / 60000));
  return {
    aqi: ctx.air.aqi,
    category: ctx.air.category,
    pm25: ctx.air.pm25,
    pm10: ctx.air.pm10,
    visibilityKm: ctx.air.visibilityKm,
    stagnant: ctx.air.stagnant,
    ageMin,
    source: ctx.air.source,
  };
}

export function toolGetBestWindow(activity: 'walk' | 'play' | 'exercise' | 'ventilate', ctx: ToolContext) {
  const res = getBestWindowForActivity(ctx.air.hourly, activity);
  return { best: res.best, worst: res.worst, pm25AtBest: res.pm25AtBest, pm25NowAvg: res.pm25NowAvg };
}

export function toolGetPlanActions(domain: string | undefined, ctx: ToolContext) {
  const plan = ctx.plan || assembleDayPlan(ctx.household, ctx.air);
  const actions = plan.blocks.flatMap((b) => b.actions);
  const filtered = domain ? actions.filter((a) => a.domain === domain) : actions;
  return filtered.map((a) => ({
    id: a.id,
    domain: a.domain,
    title: a.title,
    why: a.why,
    cost: a.cost,
    effort: a.effort,
  }));
}

export function toolSimulate(changes: string[], ctx: ToolContext) {
  const base = generateScheduleBlocks(ctx.household, ctx.air);
  const baseline = calculateDailyExposure(base);
  const changeSet = new Set(changes);
  const matched = (actionsData as Array<{ id: string; modifiers?: ActionModifier[] }>).filter((a) => changeSet.has(a.id));
  const modifiers = matched.flatMap((a) => a.modifiers || []);
  const planned = calculateDailyExposure(applyModifiers(base, modifiers));
  const deltaPct = baseline > 0 ? Math.round(((baseline - planned) / baseline) * 100) : 0;
  return { baseline: Math.round(baseline), planned: Math.round(planned), deltaPct };
}

export function toolLookupPlaybook(topic: string) {
  const topics = (playbookData as { topics?: Record<string, { title: string; summary: string; source_hint: string; confidence: string }> }).topics || {};
  const item = topics[topic];
  if (!item) return { error: `Topic '${topic}' not found in playbook` };
  return { title: item.title, summary: item.summary, source_hint: item.source_hint, confidence: item.confidence };
}

export async function executeTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
  if (name === 'get_air_now') return toolGetAirNow(ctx);
  if (name === 'get_best_window') return toolGetBestWindow((args.activity as 'walk' | 'play' | 'exercise' | 'ventilate') || 'walk', ctx);
  if (name === 'get_plan_actions') return toolGetPlanActions(args.domain as string | undefined, ctx);
  if (name === 'simulate') return toolSimulate(Array.isArray(args.changes) ? (args.changes as string[]) : [], ctx);
  if (name === 'lookup_playbook') return toolLookupPlaybook(String(args.topic || ''));
  return { error: `Unknown tool: ${name}` };
}
