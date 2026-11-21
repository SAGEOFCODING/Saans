import { ActionModifier, ChosenAction, Household, Air, MemberRisk, SimulationBlock } from './types';
import { calculateDailyExposure, applyModifiers } from './exposure';

export type Predicate =
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  | { f: string; op: '==' | '!=' | '>=' | '<=' | '>' | '<' | 'in' | 'nin' | 'contains'; v: unknown };

export interface ActionCatalogItem {
  id: string;
  domain: 'indoor' | 'commute' | 'cooking' | 'heating' | 'habit' | 'community';
  title: string | { en: string; hi?: string };
  why: string | { en: string; hi?: string };
  when: Predicate;
  requires?: { budget?: string[] };
  modifiers: ActionModifier[];
  effort: 1 | 2 | 3;
  cost: 'free' | 'low' | 'mid';
  confidence: 'high' | 'medium' | 'low';
  protective: boolean;
  excludes?: string[];
  pmTier?: 'high' | 'medium' | 'low';
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (typeof acc === 'object' && acc !== null) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function evaluatePredicate(ctx: Record<string, unknown>, pred: Predicate): boolean {
  if ('all' in pred) return pred.all.every((p) => evaluatePredicate(ctx, p));
  if ('any' in pred) return pred.any.some((p) => evaluatePredicate(ctx, p));
  if ('not' in pred) return !evaluatePredicate(ctx, pred.not);

  const val = resolvePath(ctx, pred.f);
  switch (pred.op) {
    case '==': return val === pred.v;
    case '!=': return val !== pred.v;
    case '>=': return typeof val === 'number' && typeof pred.v === 'number' && val >= pred.v;
    case '<=': return typeof val === 'number' && typeof pred.v === 'number' && val <= pred.v;
    case '>': return typeof val === 'number' && typeof pred.v === 'number' && val > pred.v;
    case '<': return typeof val === 'number' && typeof pred.v === 'number' && val < pred.v;
    case 'in': return Array.isArray(pred.v) && (pred.v as unknown[]).includes(val);
    case 'nin': return Array.isArray(pred.v) && !(pred.v as unknown[]).includes(val);
    case 'contains': return Array.isArray(val) && (val as unknown[]).includes(pred.v);
    default: return false;
  }
}

export function isActionFeasible(action: ActionCatalogItem, household: Household): boolean {
  if (household.budget === 'free' && action.cost !== 'free') return false;
  if (household.budget === 'low' && action.cost === 'mid') return false;
  if (action.requires?.budget && !action.requires.budget.includes(household.budget)) return false;

  const pur = household.home.purifier;
  if (action.id === 'bedroom-purifier-night' && (pur === 'bedroom' || pur === 'both')) return false;
  if (action.id === 'living-purifier-day' && pur === 'none') return false;
  return true;
}

interface ScoredCandidate {
  action: ActionCatalogItem;
  deltaPct: number;
  score: number;
}

function scoreAndSortCandidates(
  feasible: ActionCatalogItem[],
  baselineBlocks: SimulationBlock[],
  worstRisk: MemberRisk
): ScoredCandidate[] {
  const baseExposure = calculateDailyExposure(baselineBlocks) || 1;
  const scored = feasible.map((a) => {
    const modBlocks = applyModifiers(baselineBlocks, a.modifiers);
    const modExp = calculateDailyExposure(modBlocks);
    const deltaPct = Math.max(0, ((baseExposure - modExp) / baseExposure) * 100);
    const sev = a.protective ? worstRisk.tier : 0;
    const score = (deltaPct + sev * 15 + 5) / a.effort;
    return { action: a, deltaPct, score };
  });
  return scored.sort((a, b) => b.score - a.score);
}

function applySelectionRules(
  scored: ScoredCandidate[],
  worstRiskTier: number,
  limit: number = 6
): ScoredCandidate[] {
  const selected: ScoredCandidate[] = [];
  const excludedIds = new Set<string>();

  for (const item of scored) {
    if (selected.length >= limit) break;
    if (excludedIds.has(item.action.id)) continue;
    selected.push(item);
    if (item.action.excludes) item.action.excludes.forEach((id) => excludedIds.add(id));
  }

  if (worstRiskTier >= 4 && !selected.some((s) => s.action.protective)) {
    const protCandidate = scored.find((s) => s.action.protective && !excludedIds.has(s.action.id));
    if (protCandidate && selected.length > 0) {
      selected[selected.length - 1] = protCandidate;
    }
  }

  return selected;
}

function toChosenAction(item: ScoredCandidate): ChosenAction {
  const { action, deltaPct } = item;
  return {
    id: action.id,
    domain: action.domain,
    title: action.title,
    why: action.why,
    impact: { exposureDeltaPct: Math.round(deltaPct), pmTier: action.pmTier },
    confidence: action.confidence,
    effort: action.effort,
    cost: action.cost,
  };
}

export function selectActions(
  catalog: ActionCatalogItem[],
  ctx: { air: Air; household: Household; worstRisk: MemberRisk; baselineBlocks: SimulationBlock[] }
): ChosenAction[] {
  const evalCtx: Record<string, unknown> = {
    air: ctx.air,
    household: ctx.household,
    home: ctx.household.home,
    mobility: ctx.household.mobility,
    worstRisk: ctx.worstRisk,
  };

  const feasible = catalog.filter((a) => evaluatePredicate(evalCtx, a.when) && isActionFeasible(a, ctx.household));
  const scored = scoreAndSortCandidates(feasible, ctx.baselineBlocks, ctx.worstRisk);
  const selected = applySelectionRules(scored, ctx.worstRisk.tier);
  return selected.map(toChosenAction);
}
