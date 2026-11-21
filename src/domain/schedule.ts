import { Air, Household, SimulationBlock } from './types';
import factors from '../data/impact-factors.json';

export function getCookingAddition(household: Household): number {
  if (household.home.cooking === 'biomass') {
    return factors.indoorSources['biomass-cooking'];
  }
  if (!household.home.chimney && (household.home.cooking === 'lpg' || household.home.cooking === 'png')) {
    return factors.indoorSources['gas-cooking-no-chimney'];
  }
  return 0;
}

interface BlockContext {
  basePm25: number;
  nightEnv: number;
  dayEnv: number;
  cookAddition: number;
  commuteEnv: number;
  morningActivity: number;
}

function createCommuteDayBlocks(ctx: BlockContext): SimulationBlock[] {
  const { basePm25, nightEnv, dayEnv, cookAddition, commuteEnv, morningActivity } = ctx;
  return [
    { id: 'night-sleep', hours: 8, cOut: basePm25, envFactor: nightEnv, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'morning-routine', hours: 3, cOut: basePm25 * 1.1, envFactor: factors.indoorInfiltration.closed, activityFactor: morningActivity, protectionFactor: 1.0, indoorSource: cookAddition },
    { id: 'commute-morning', hours: 1, cOut: basePm25 * 1.2, envFactor: commuteEnv, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'daytime', hours: 7, cOut: basePm25 * 0.9, envFactor: dayEnv, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'commute-evening', hours: 1, cOut: basePm25 * 1.15, envFactor: commuteEnv, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'evening-routine', hours: 4, cOut: basePm25 * 1.1, envFactor: factors.indoorInfiltration.closed, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: cookAddition },
  ];
}

function createStandardDayBlocks(ctx: BlockContext): SimulationBlock[] {
  const { basePm25, nightEnv, dayEnv, cookAddition, morningActivity } = ctx;
  return [
    { id: 'night-sleep', hours: 8, cOut: basePm25, envFactor: nightEnv, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'morning-routine', hours: 3, cOut: basePm25 * 1.1, envFactor: factors.indoorInfiltration.closed, activityFactor: morningActivity, protectionFactor: 1.0, indoorSource: cookAddition },
    { id: 'daytime', hours: 9, cOut: basePm25 * 0.9, envFactor: dayEnv, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: 0 },
    { id: 'evening-routine', hours: 4, cOut: basePm25 * 1.1, envFactor: factors.indoorInfiltration.closed, activityFactor: factors.activity.light, protectionFactor: 1.0, indoorSource: cookAddition },
  ];
}

function getInfiltrationFactors(purifier: Household['home']['purifier']) {
  const isBedroomClean = purifier === 'bedroom' || purifier === 'both';
  const isLivingClean = purifier === 'living' || purifier === 'both';
  return {
    nightEnv: isBedroomClean ? factors.indoorInfiltration['closed+purifier'] : factors.indoorInfiltration.closed,
    dayEnv: isLivingClean ? factors.indoorInfiltration['closed+purifier'] : factors.indoorInfiltration.closed,
  };
}

export function generateScheduleBlocks(
  household: Household,
  air: Air
): SimulationBlock[] {
  const { nightEnv, dayEnv } = getInfiltrationFactors(household.home.purifier);
  const commuteMode = household.mobility.mode;
  const ctx: BlockContext = {
    basePm25: air.pm25 ?? 100,
    nightEnv,
    dayEnv,
    cookAddition: getCookingAddition(household),
    commuteEnv: factors.commute[commuteMode] ?? 1.0,
    morningActivity: household.mobility.exercisesOutdoors ? factors.activity.exercise : factors.activity.light,
  };

  const isCommuter = household.mobility.distance !== 'short' || commuteMode !== 'walk';
  return isCommuter ? createCommuteDayBlocks(ctx) : createStandardDayBlocks(ctx);
}
