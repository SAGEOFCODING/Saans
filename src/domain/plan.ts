import { Air, Block, DayPlan, Household, ChosenAction, SimulationBlock } from './types';
import actionsData from '../data/actions.json';
import { assessHouseholdRisk, getWorstMemberRisk } from './risk';
import { findBestWindow } from './window';
import { generateScheduleBlocks } from './schedule';
import { calculateExposureIndex, applyModifiers } from './exposure';
import { ActionCatalogItem, selectActions } from './rules';
import { getSeason, getGRAPStage } from './context';

function assignActionToBlockId(action: ChosenAction, catalogItem?: ActionCatalogItem): string {
  if (catalogItem?.modifiers && catalogItem.modifiers.length > 0) {
    return catalogItem.modifiers[0].block;
  }
  const d = action.domain;
  if (d === 'commute') return 'commute-morning';
  if (d === 'cooking') return 'evening-routine';
  if (d === 'indoor') return 'daytime';
  if (d === 'community') return 'daytime';
  return 'morning-routine';
}

function buildDayPlanBlocks(
  baselineBlocks: SimulationBlock[],
  chosenActions: ChosenAction[],
  catalog: ActionCatalogItem[]
): Block[] {
  const actionBlockMap = new Map<string, ChosenAction[]>();
  for (const b of baselineBlocks) actionBlockMap.set(b.id, []);

  for (const action of chosenActions) {
    const item = catalog.find((c) => c.id === action.id);
    const targetBlockId = assignActionToBlockId(action, item);
    const list = actionBlockMap.get(targetBlockId) || actionBlockMap.get('morning-routine') || [];
    list.push(action);
    actionBlockMap.set(targetBlockId, list);
  }

  return baselineBlocks.map((b) => ({
    id: b.id,
    actions: actionBlockMap.get(b.id) || [],
  }));
}

function calculatePlannedExposure(
  baselineBlocks: SimulationBlock[],
  chosenActions: ChosenAction[],
  catalog: ActionCatalogItem[]
): number {
  const allModifiers = chosenActions.flatMap((ca) => {
    const item = catalog.find((c) => c.id === ca.id);
    return item ? item.modifiers : [];
  });
  const plannedBlocks = applyModifiers(baselineBlocks, allModifiers);
  return calculateExposureIndex(plannedBlocks).exposureIndex;
}

function getPlanContext(air: Air, now?: Date) {
  const refDate = now || new Date(air.at || '2026-11-21T06:00:00Z');
  const grap = getGRAPStage(air.aqi);
  return {
    season: getSeason(refDate).season,
    civic: grap ? `${grap.name}: ${grap.hint}` : undefined,
  };
}

export function assembleDayPlan(
  household: Household,
  air: Air,
  now?: Date
): DayPlan {
  const risks = assessHouseholdRisk(household.members, air.category);
  const worstRisk = getWorstMemberRisk(risks);
  const windowResult = findBestWindow(air.hourly || [], 1);
  const baselineBlocks = generateScheduleBlocks(household, air);
  const { exposureIndex: baseline } = calculateExposureIndex(baselineBlocks);

  const catalog = actionsData as ActionCatalogItem[];
  const chosenActions = selectActions(catalog, { air, household, worstRisk, baselineBlocks });
  const planned = calculatePlannedExposure(baselineBlocks, chosenActions, catalog);
  const blocks = buildDayPlanBlocks(baselineBlocks, chosenActions, catalog);
  const { season, civic } = getPlanContext(air, now);

  return {
    air,
    risks,
    blocks,
    baseline,
    planned,
    window: { best: windowResult.best, worst: windowResult.worst },
    civic,
    season,
  };
}
