import { describe, it, expect } from 'vitest';
import { generateScheduleBlocks, getCookingAddition } from '@/domain/schedule';
import { priyaHousehold, rohanHousehold, sampleSevereAir } from '../e2e/harness/fixtures';

describe('Domain: Schedule & Microenvironments (Feature 11)', () => {
  it('generates 24-hour routine blocks for long-distance commuter', () => {
    // Rohan is a two-wheeler commuter
    const blocks = generateScheduleBlocks(rohanHousehold, sampleSevereAir);
    const totalHours = blocks.reduce((acc, b) => acc + b.hours, 0);
    expect(totalHours).toBe(24);

    const commuteMorning = blocks.find((b) => b.id === 'commute-morning');
    expect(commuteMorning).toBeDefined();
    expect(commuteMorning?.envFactor).toBe(1.2); // two-wheeler factor

    const nightBlock = blocks.find((b) => b.id === 'night-sleep');
    expect(nightBlock).toBeDefined();
    expect(nightBlock?.hours).toBe(8);
    expect(nightBlock?.envFactor).toBe(0.6); // closed windows, no purifier
  });

  it('reflects existing bedroom purifier in night-sleep baseline block', () => {
    const householdWithPurifier = {
      ...priyaHousehold,
      home: {
        ...priyaHousehold.home,
        purifier: 'bedroom' as const,
      },
    };

    const blocks = generateScheduleBlocks(householdWithPurifier, sampleSevereAir);
    const nightBlock = blocks.find((b) => b.id === 'night-sleep');
    expect(nightBlock?.envFactor).toBe(0.3); // closed + purifier factor
  });

  it('calculates indoor cooking additions accurately based on stove and chimney profile', () => {
    // LPG without chimney -> +15 ug/m3
    expect(getCookingAddition(rohanHousehold)).toBe(15);

    // Biomass cooking -> +40 ug/m3
    const biomassHousehold = {
      ...rohanHousehold,
      home: { ...rohanHousehold.home, cooking: 'biomass' as const, chimney: false },
    };
    expect(getCookingAddition(biomassHousehold)).toBe(40);

    // LPG with chimney -> 0 ug/m3
    const chimneyHousehold = {
      ...rohanHousehold,
      home: { ...rohanHousehold.home, cooking: 'lpg' as const, chimney: true },
    };
    expect(getCookingAddition(chimneyHousehold)).toBe(0);

    // Induction cooktop -> 0 ug/m3
    const inductionHousehold = {
      ...rohanHousehold,
      home: { ...rohanHousehold.home, cooking: 'induction' as const, chimney: false },
    };
    expect(getCookingAddition(inductionHousehold)).toBe(0);
  });

  it('correctly uses pm25 = 0 without falling back to default 100', () => {
    const zeroAir = { ...sampleSevereAir, pm25: 0 };
    const blocks = generateScheduleBlocks(rohanHousehold, zeroAir);
    const nightBlock = blocks.find((b) => b.id === 'night-sleep');
    expect(nightBlock?.cOut).toBe(0);
  });
});
