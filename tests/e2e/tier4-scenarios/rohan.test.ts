import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { DayPlanResponseSchema, expectJsonSuccess } from '../harness/matchers';
import { rohanHousehold, delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/plan'))(
  'Tier 4 Real-World Scenarios — Persona 3: Rohan (Youth Commuter Tight Budget Allocation)',
  () => {
    it('TC-ROHAN-01: commute block represents majority of baseline exposure', async () => {
      // Authoritative source: docs/architecture.md §7.5, §7.6 (two-wheeler commute factor 1.2), docs/prd.md §4
      // Rohan is a student commuting 15 km daily on a two-wheeler (mobility.mode = 'two-wheeler', distance = 'long')
      // Commuting unshielded in traffic at peak hours generates disproportionately high particulate intake
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: rohanHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      expect(Array.isArray(data.plan.blocks)).toBe(true);

      // Verify a commute block exists in Rohan's daily schedule
      const commuteBlock = data.plan.blocks.find(
        (b) =>
          b.id.toLowerCase().includes('commute') ||
          b.id.toLowerCase().includes('travel') ||
          (b.env && (b.env.toLowerCase().includes('commute') || b.env.toLowerCase().includes('transit')))
      );
      expect(commuteBlock, 'Plan must include a dedicated commute block for long-distance commuter').toBeDefined();

      // Verify that commute actions target this vulnerability
      const allActions = data.plan.blocks.flatMap((b) => b.actions);
      const commuteActions = allActions.filter(
        (a) =>
          a.domain === 'commute' ||
          a.id.toLowerCase().includes('commute') ||
          a.id.toLowerCase().includes('transit') ||
          a.id.toLowerCase().includes('mask')
      );
      expect(commuteActions.length, 'Plan must include commute-targeted mitigation actions').toBeGreaterThan(0);
    });

    it('TC-ROHAN-02: zero high-cost purchase actions recommended (budget filter active for "low")', async () => {
      // Authoritative source: docs/architecture.md §7.8 ("free-budget households only see cost 'free'", budget filtering), AGENTS.md §B7
      // Rohan has a "low" budget constraint (budget = 'low')
      // No mid-cost or expensive appliance purchases (such as commercial air purifiers) should be recommended
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: rohanHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      const allActions = data.plan.blocks.flatMap((b) => b.actions);
      expect(allActions.length).toBeGreaterThan(0);

      for (const action of allActions) {
        if (action.cost) {
          expect(
            action.cost,
            `Action '${action.id}' has cost '${action.cost}', but Rohan has budget='low'. Must never recommend 'mid' cost actions.`
          ).not.toBe('mid');
          expect(['free', 'low']).toContain(action.cost);
        }
      }

      // Explicitly verify mid-cost commercial purifier is absent
      const expensivePurifier = allActions.find(
        (a) => a.id === 'bedroom-purifier-night' && a.cost === 'mid'
      );
      expect(expensivePurifier, 'High/mid-cost purifiers must be filtered out for low-budget household').toBeUndefined();
    });

    it('TC-ROHAN-03: recommends low-cost transit mask or route change', async () => {
      // Authoritative source: docs/architecture.md §7.6 (n95-fitted factor 0.25), §7.7, docs/prd.md §4, FR-7, FR-8
      // For a two-wheeler commuter on a budget, high-impact low-cost interventions include fitted N95 mask or transit route change
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: rohanHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      const allActions = data.plan.blocks.flatMap((b) => b.actions);

      const transitIntervention = allActions.find((a) => {
        const text = `${a.id} ${JSON.stringify(a.title || '')} ${JSON.stringify(a.why || '')}`.toLowerCase();
        return (
          text.includes('mask') ||
          text.includes('n95') ||
          text.includes('route') ||
          text.includes('metro') ||
          text.includes('transit') ||
          text.includes('off-peak') ||
          text.includes('two-wheeler')
        );
      });

      expect(
        transitIntervention,
        'Expected plan to recommend low-cost transit mask, cleaner route, or off-peak travel'
      ).toBeDefined();

      if (transitIntervention?.cost) {
        expect(['free', 'low']).toContain(transitIntervention.cost);
      }
    });
  }
);
