import { describe, it, expect } from 'vitest';
import { assembleDayPlan } from '@/domain/plan';
import { DayPlanSchema } from '@/domain/types';
import {
  priyaHousehold,
  mehtaHousehold,
  rohanHousehold,
  anilHousehold,
  sampleSevereAir,
} from '../e2e/harness/fixtures';

describe('Domain: DayPlan Assembly & Golden Personas (Feature 16)', () => {
  it('assembles a valid schema-compliant DayPlan for Persona 1 (Priya)', () => {
    const plan = assembleDayPlan(priyaHousehold, sampleSevereAir);
    const parseRes = DayPlanSchema.safeParse(plan);
    expect(parseRes.success, 'Plan must match DayPlanSchema').toBe(true);

    // Infant member risk must be Tier 5
    const infantRisk = plan.risks.find((r) => r.band === 'infant');
    expect(infantRisk?.tier).toBe(5);

    // All actions in plan
    const allActions = plan.blocks.flatMap((b) => b.actions);
    expect(allActions.length).toBeGreaterThan(0);

    // Mandatory protective indoor action: bedroom purifier or DIY box-fan filter
    const hasPurifier = allActions.some(
      (a) => a.id.includes('purifier') || a.id.includes('box-fan') || a.id.includes('filter')
    );
    expect(hasPurifier).toBe(true);

    // Baseline > planned
    expect(plan.baseline).toBeDefined();
    expect(plan.planned).toBeDefined();
    expect(plan.planned!).toBeLessThan(plan.baseline!);
  });

  it('assembles a valid DayPlan for Persona 2 (Mr. Mehta) with walking shift and window sealing', () => {
    const plan = assembleDayPlan(mehtaHousehold, sampleSevereAir);
    expect(DayPlanSchema.safeParse(plan).success).toBe(true);

    // Senior sensitive member risk must be Tier 5
    const seniorRisk = plan.risks.find((r) => r.band === 'senior');
    expect(seniorRisk?.tier).toBe(5);

    // Walking or window sealing actions present
    const allActions = plan.blocks.flatMap((b) => b.actions);
    const hasWalkOrDraftAction = allActions.some((a) => {
      const text = `${a.id} ${JSON.stringify(a.title || '')} ${JSON.stringify(a.why || '')}`.toLowerCase();
      return (
        text.includes('walk') ||
        text.includes('exercise') ||
        text.includes('draft') ||
        text.includes('seal') ||
        text.includes('window')
      );
    });
    expect(hasWalkOrDraftAction).toBe(true);
  });

  it('assembles a valid DayPlan for Persona 3 (Rohan) with low-budget constraints strictly enforced', () => {
    const plan = assembleDayPlan(rohanHousehold, sampleSevereAir);
    expect(DayPlanSchema.safeParse(plan).success).toBe(true);

    const allActions = plan.blocks.flatMap((b) => b.actions);
    expect(allActions.length).toBeGreaterThan(0);

    // Zero 'mid' cost actions allowed for Rohan (budget = 'low')
    for (const a of allActions) {
      if (a.cost) {
        expect(a.cost, `Action ${a.id} must not be mid-cost`).not.toBe('mid');
        expect(['free', 'low']).toContain(a.cost);
      }
    }

    // Commute actions present
    const hasCommuteAction = allActions.some((a) => a.domain === 'commute' || a.id.includes('commute') || a.id.includes('mask'));
    expect(hasCommuteAction).toBe(true);
  });

  it('assembles a valid DayPlan for Persona 4 (Anil) with community pack actions', () => {
    const plan = assembleDayPlan(anilHousehold, sampleSevereAir);
    expect(DayPlanSchema.safeParse(plan).success).toBe(true);

    const allActions = plan.blocks.flatMap((b) => b.actions);
    const hasCommunityAction = allActions.some(
      (a) => a.domain === 'community' || a.id.includes('rwa') || a.id.includes('waste') || a.id.includes('generator')
    );
    expect(hasCommunityAction).toBe(true);
  });
});
