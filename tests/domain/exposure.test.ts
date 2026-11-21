import { describe, it, expect } from 'vitest';
import {
  calculateBlockExposure,
  calculateDailyExposure,
  calculateExposureIndex,
  applyModifiers,
} from '@/domain/exposure';
import { SimulationBlock, ActionModifier } from '@/domain/types';

describe('Domain: Exposure Modeling Engine (Feature 12)', () => {
  const baseBlock: SimulationBlock = {
    id: 'night-sleep',
    hours: 8,
    cOut: 200,
    envFactor: 0.6,
    activityFactor: 1.0,
    protectionFactor: 1.0,
    indoorSource: 0,
  };

  it('computes single block exposure from duration, infiltration, activity, and protection', () => {
    // 8h * (200 * 0.6 + 0) * 1.0 * 1.0 = 8 * 120 = 960
    const exposure = calculateBlockExposure(baseBlock);
    expect(exposure).toBe(960);
  });

  it('calculates daily exposure index scaled against 1440 reference day', () => {
    const blocks: SimulationBlock[] = [
      baseBlock, // 960
      {
        id: 'daytime',
        hours: 16,
        cOut: 200,
        envFactor: 0.6,
        activityFactor: 1.0,
        protectionFactor: 1.0,
        indoorSource: 0,
      }, // 16 * 120 = 1920
    ];
    // Total exposure = 960 + 1920 = 2880
    // Index = (2880 / 1440) * 100 = 200
    const result = calculateExposureIndex(blocks);
    expect(result.dailyExposure).toBe(2880);
    expect(result.exposureIndex).toBe(200);
  });

  it('shows overnight bedroom purifier cuts night exposure by 50% and daily index by ~28-36%', () => {
    // Diurnal winter smog profile with nocturnal inversion (360 ug/m3) and afternoon dip (75 ug/m3)
    const baseBlocks: SimulationBlock[] = [
      { id: 'night-sleep', hours: 8, cOut: 360, envFactor: 0.6, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
      { id: 'morning-indoor', hours: 4, cOut: 140, envFactor: 0.6, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
      { id: 'daytime-indoor', hours: 8, cOut: 75, envFactor: 0.6, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
      { id: 'evening-indoor', hours: 4, cOut: 140, envFactor: 0.6, activityFactor: 1.0, protectionFactor: 1.0, indoorSource: 0 },
    ];
    const baseDaily = calculateDailyExposure(baseBlocks);

    const purifierMod: ActionModifier[] = [
      { block: 'night-sleep', set: { envFactor: 0.3 } },
    ];
    const plannedBlocks = applyModifiers(baseBlocks, purifierMod);
    const plannedDaily = calculateDailyExposure(plannedBlocks);

    const totalReductionPct = ((baseDaily - plannedDaily) / baseDaily) * 100;
    expect(totalReductionPct).toBeGreaterThanOrEqual(28.0);
    expect(totalReductionPct).toBeLessThanOrEqual(36.0);
  });

  it('shows fitted N95 respirator reduces commute exposure by 75%', () => {
    const commuteBlockWithoutMask: SimulationBlock = {
      id: 'commute-twowheeler',
      hours: 1.5,
      cOut: 250,
      envFactor: 1.2,
      activityFactor: 1.2,
      protectionFactor: 1.0,
      indoorSource: 0,
    };
    const baselineIntake = calculateBlockExposure(commuteBlockWithoutMask);

    const maskMod: ActionModifier[] = [
      { block: 'commute-twowheeler', set: { protectionFactor: 0.25 } },
    ];
    const [commuteWithMask] = applyModifiers([commuteBlockWithoutMask], maskMod);
    const plannedIntake = calculateBlockExposure(commuteWithMask);

    const reductionPct = ((baselineIntake - plannedIntake) / baselineIntake) * 100;
    expect(reductionPct).toBeCloseTo(75.0, 1);
  });
});
