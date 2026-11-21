import { describe, it, expect } from 'vitest';
import {
  evaluatePredicate,
  isActionFeasible,
  selectActions,
  ActionCatalogItem,
} from '@/domain/rules';
import { rohanHousehold, priyaHousehold, sampleSevereAir } from '../e2e/harness/fixtures';
import { generateScheduleBlocks } from '@/domain/schedule';

describe('Domain: Rules Engine & Action Selection (Feature 13)', () => {
  it('evaluates AST predicates across all, any, not, and comparison operators', () => {
    const ctx = {
      air: { aqi: 250, stagnant: true },
      household: { budget: 'low' },
      mobility: { mode: 'two-wheeler' },
    };

    expect(evaluatePredicate(ctx, { f: 'air.aqi', op: '>=', v: 200 })).toBe(true);
    expect(evaluatePredicate(ctx, { f: 'air.aqi', op: '<', v: 100 })).toBe(false);
    expect(evaluatePredicate(ctx, { f: 'mobility.mode', op: 'in', v: ['two-wheeler', 'walk'] })).toBe(true);
    expect(evaluatePredicate(ctx, { f: 'mobility.mode', op: 'nin', v: ['car-recirc'] })).toBe(true);

    // Compound logic
    expect(
      evaluatePredicate(ctx, {
        all: [
          { f: 'air.aqi', op: '>=', v: 200 },
          { f: 'household.budget', op: '==', v: 'low' },
        ],
      })
    ).toBe(true);

    expect(
      evaluatePredicate(ctx, {
        not: { f: 'air.stagnant', op: '==', v: false },
      })
    ).toBe(true);
  });

  it('filters actions strictly based on household budget tier', () => {
    const midCostAction: ActionCatalogItem = {
      id: 'test-mid-action',
      domain: 'indoor',
      title: 'Buy HEPA Purifier',
      why: 'Cleans air',
      when: { f: 'air.aqi', op: '>=', v: 100 },
      modifiers: [],
      effort: 1,
      cost: 'mid',
      confidence: 'high',
      protective: true,
    };

    const freeHousehold = { ...rohanHousehold, budget: 'free' as const };
    const lowHousehold = { ...rohanHousehold, budget: 'low' as const };
    const midHousehold = { ...rohanHousehold, budget: 'mid' as const };

    expect(isActionFeasible(midCostAction, freeHousehold)).toBe(false);
    expect(isActionFeasible(midCostAction, lowHousehold)).toBe(false);
    expect(isActionFeasible(midCostAction, midHousehold)).toBe(true);
  });

  it('disqualifies purifier purchase actions if already owned', () => {
    const buyBedroomPurifier: ActionCatalogItem = {
      id: 'bedroom-purifier-night',
      domain: 'indoor',
      title: 'Run Bedroom Purifier',
      why: 'Cleans room',
      when: { f: 'air.aqi', op: '>=', v: 100 },
      modifiers: [],
      effort: 1,
      cost: 'mid',
      confidence: 'high',
      protective: true,
    };

    const ownsPurifierHousehold = {
      ...priyaHousehold,
      home: { ...priyaHousehold.home, purifier: 'bedroom' as const },
    };
    expect(isActionFeasible(buyBedroomPurifier, ownsPurifierHousehold)).toBe(false);
  });

  it('resolves mutual exclusion conflicts between incompatible actions', () => {
    const catalog: ActionCatalogItem[] = [
      {
        id: 'bedroom-purifier-night',
        domain: 'indoor',
        title: 'Run bedroom purifier',
        why: 'Cleans air',
        when: { f: 'air.aqi', op: '>=', v: 100 },
        modifiers: [{ block: 'night-sleep', set: { envFactor: 0.3 } }],
        effort: 1,
        cost: 'mid',
        confidence: 'high',
        protective: true,
        excludes: ['diy-box-fan-filter'],
      },
      {
        id: 'diy-box-fan-filter',
        domain: 'indoor',
        title: 'Build DIY box-fan filter',
        why: 'Affordable air cleaning',
        when: { f: 'air.aqi', op: '>=', v: 100 },
        modifiers: [{ block: 'night-sleep', set: { envFactor: 0.38 } }],
        effort: 2,
        cost: 'low',
        confidence: 'medium',
        protective: true,
        excludes: ['bedroom-purifier-night'],
      },
    ];

    const baselineBlocks = generateScheduleBlocks(priyaHousehold, sampleSevereAir);
    const selected = selectActions(catalog, {
      air: sampleSevereAir,
      household: priyaHousehold,
      worstRisk: { tier: 5 },
      baselineBlocks,
    });

    // Exactly one of the two should be selected, never both
    const ids = selected.map((s) => s.id);
    const containsPurifier = ids.includes('bedroom-purifier-night');
    const containsDiy = ids.includes('diy-box-fan-filter');

    expect(containsPurifier && containsDiy).toBe(false);
    expect(containsPurifier || containsDiy).toBe(true);
  });
});
