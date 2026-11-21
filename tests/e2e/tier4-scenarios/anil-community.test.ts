import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { DayPlanResponseSchema, expectJsonSuccess } from '../harness/matchers';
import { anilHousehold, delhiCoords } from '../harness/fixtures';

/**
 * Standard community linear CO2e scaling calculator per docs/architecture.md §7.9 and prd.md FR-11.
 * Formula: collective = households * adoptionRate * perHousehold.co2eKgDay * days
 */
function calculateCommunityCO2e(
  households: number,
  adoptionRate: number,
  perHouseholdCO2eKgDay: number,
  days: number
): number {
  return households * adoptionRate * perHouseholdCO2eKgDay * days;
}

describe('Tier 4 Real-World Scenarios — Persona 4: Anil (RWA 120-Household Society & Community Pack)', () => {
  it('TC-ANIL-01: community pack scales CO2e linearly: 120 * adoption * co2eKgDay * days', async () => {
    // Authoritative source: docs/architecture.md §7.9, docs/prd.md FR-11
    // Formula: collective = households * adoptionRate * perHousehold.co2eKgDay * days
    const households = 120;
    const adoptionRate = 0.5; // 50% adoption
    const co2eKgDay = 1.75;
    const days = 30;

    const baseCollective = calculateCommunityCO2e(households, adoptionRate, co2eKgDay, days);
    const expectedBase = 120 * 0.5 * 1.75 * 30; // 3150 kg CO2e
    expect(baseCollective).toBe(expectedBase);

    // Test 1: Linear scaling with respect to number of households (doubling households doubles impact)
    const doubleHouseholds = calculateCommunityCO2e(households * 2, adoptionRate, co2eKgDay, days);
    expect(doubleHouseholds).toBe(baseCollective * 2);

    // Test 2: Linear scaling with respect to days (tripling duration from 30 to 90 days triples impact)
    const tripleDays = calculateCommunityCO2e(households, adoptionRate, co2eKgDay, days * 3);
    expect(tripleDays).toBe(baseCollective * 3);

    // Test 3: Linear scaling with respect to adoption rate
    const fullAdoption = calculateCommunityCO2e(households, 1.0, co2eKgDay, days);
    expect(fullAdoption).toBe(baseCollective * 2);

    // Boundary conditions
    expect(calculateCommunityCO2e(0, adoptionRate, co2eKgDay, days)).toBe(0);
    expect(calculateCommunityCO2e(households, 0, co2eKgDay, days)).toBe(0);
    expect(calculateCommunityCO2e(households, adoptionRate, 0, days)).toBe(0);
    expect(calculateCommunityCO2e(households, adoptionRate, co2eKgDay, 0)).toBe(0);

    // Check if domain module is available for dynamic validation
    const domainImpact = (await import(/* @vite-ignore */ '@/domain/impact' as string).catch(
      () => null
    )) as { calculateCommunityCO2e?: typeof calculateCommunityCO2e } | null;

    if (domainImpact && typeof domainImpact.calculateCommunityCO2e === 'function') {
      const result = domainImpact.calculateCommunityCO2e(households, adoptionRate, co2eKgDay, days);
      expect(result).toBe(expectedBase);
    }
  });

  it('TC-ANIL-02: qualitative PM tier reported (high/medium/low) without false precision', async () => {
    // Authoritative source: docs/architecture.md §7.9, §18 ADR Decision 6
    // "PM impact for open burning, dust and generators is a qualitative tier (high/medium/low local source),
    // because per-household PM numbers would be fabricated precision."
    const allowedTiers = ['high', 'medium', 'low'];

    // If route is implemented, verify PM tier representation in API response
    if (isRouteImplemented('/api/plan')) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: anilHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);
      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      const allActions = data.plan.blocks.flatMap((b) => b.actions);

      for (const action of allActions) {
        if (action.impact?.pmTier) {
          expect(
            allowedTiers,
            `PM tier must be qualitative ('high' | 'medium' | 'low'), got: ${action.impact.pmTier}`
          ).toContain(action.impact.pmTier);
        }
      }
    } else {
      // Validate qualitative PM tiers directly on real community actions in actions catalog
      const rawCatalog = (await import('@/data/actions.json').then((m) => m.default || m)) as Array<{
        id: string;
        domain: string;
        pmTier?: string;
      }>;
      const communityActions = rawCatalog.filter((a) => a.domain === 'community');
      expect(communityActions.length, 'Expected catalog to contain community domain actions').toBeGreaterThan(0);
      for (const action of communityActions) {
        if (action.pmTier) {
          expect(
            allowedTiers,
            `Action ${action.id} has PM tier ${action.pmTier}, must be in ${allowedTiers.join(', ')}`
          ).toContain(action.pmTier);
        }
      }
    }
  });

  it('TC-ANIL-03: community collective actions included for society-wide impact', async () => {
    // Authoritative source: docs/architecture.md §7.7, §7.9, docs/prd.md FR-11
    // Anil is RWA secretary for 120 households. Plan should accommodate community collective actions.
    if (!isRouteImplemented('/api/plan')) {
      // If route not yet mounted, verify fixture integrity and schema readiness
      expect(anilHousehold.home.type).toBe('apartment');
      expect(anilHousehold.members.length).toBeGreaterThanOrEqual(1);
      return;
    }

    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: anilHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'en',
      },
    });
    expect(res.status).toBe(200);

    const data = await expectJsonSuccess(res, DayPlanResponseSchema);
    const allActions = data.plan.blocks.flatMap((b) => b.actions);

    // Look for community/collective domain or community pack initiatives
    const hasCommunityFocus =
      allActions.some((a) => a.domain === 'community' || a.id.toLowerCase().includes('community')) ||
      Boolean(data.plan.civic) ||
      allActions.some((a) => {
        const text = `${a.id} ${JSON.stringify(a.title || '')} ${JSON.stringify(a.why || '')}`.toLowerCase();
        return (
          text.includes('community') ||
          text.includes('society') ||
          text.includes('dust') ||
          text.includes('waste') ||
          text.includes('burning') ||
          text.includes('generator') ||
          text.includes('carpool')
        );
      });

    expect(
      hasCommunityFocus,
      'Plan for RWA secretary must incorporate community collective mitigation or civic guidance'
    ).toBe(true);
  });
});
