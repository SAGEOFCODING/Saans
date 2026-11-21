import { useMemo } from 'react';
import type { Household, Air, ActionModifier } from '@/domain/types';
import { generateScheduleBlocks } from '@/domain/schedule';
import { applyModifiers, calculateDailyExposure } from '@/domain/exposure';
import actionsData from '@/data/actions.json';

interface ActionWithModifiers {
  id: string;
  modifiers?: ActionModifier[];
}

export function useWhatIf(
  household: Household | null,
  air: Air | null,
  activeActionIds: string[]
) {
  return useMemo(() => {
    if (!household || !air) {
      return { baseline: 0, simulated: 0, deltaPct: 0 };
    }

    const baseBlocks = generateScheduleBlocks(household, air);
    const baseline = calculateDailyExposure(baseBlocks);

    const activeList = (actionsData as ActionWithModifiers[]).filter((a) =>
      activeActionIds.includes(a.id)
    );
    const modifiers = activeList.flatMap((a) => a.modifiers || []);
    const modifiedBlocks = applyModifiers(baseBlocks, modifiers);
    const simulated = calculateDailyExposure(modifiedBlocks);

    const deltaPct =
      baseline > 0
        ? Math.max(0, Math.round(((baseline - simulated) / baseline) * 100))
        : 0;

    return {
      baseline: Math.round(baseline),
      simulated: Math.round(simulated),
      deltaPct,
    };
  }, [household, air, activeActionIds]);
}
