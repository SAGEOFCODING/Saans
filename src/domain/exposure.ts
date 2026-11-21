import { ActionModifier, SimulationBlock } from './types';
import factors from '../data/impact-factors.json';

export function calculateBlockExposure(block: SimulationBlock): number {
  const cEnv = block.cOut * block.envFactor + block.indoorSource;
  return block.hours * cEnv * block.activityFactor * block.protectionFactor;
}

export function calculateDailyExposure(blocks: SimulationBlock[]): number {
  return blocks.reduce((sum, b) => sum + calculateBlockExposure(b), 0);
}

export function calculateExposureIndex(blocks: SimulationBlock[]): {
  dailyExposure: number;
  exposureIndex: number;
} {
  const dailyExposure = calculateDailyExposure(blocks);
  const ref = factors.referenceDayExposure || 1440;
  const exposureIndex = Math.round((dailyExposure / ref) * 100);
  return { dailyExposure, exposureIndex };
}

export function applyModifiers(
  blocks: SimulationBlock[],
  modifiers: ActionModifier[]
): SimulationBlock[] {
  return blocks.map((block) => {
    let updated = { ...block };
    for (const mod of modifiers) {
      if (mod.block === block.id && mod.set) {
        updated = {
          ...updated,
          envFactor: mod.set.envFactor ?? updated.envFactor,
          protectionFactor: mod.set.protectionFactor ?? updated.protectionFactor,
          activityFactor: mod.set.activityFactor ?? updated.activityFactor,
          indoorSource: mod.set.indoorSource ?? updated.indoorSource,
          hours: mod.set.hours ?? updated.hours,
        };
      }
    }
    return updated;
  });
}
