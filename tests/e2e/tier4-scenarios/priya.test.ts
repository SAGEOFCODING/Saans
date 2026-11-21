import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { DayPlanResponseSchema, expectJsonSuccess } from '../harness/matchers';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/plan'))(
  'Tier 4 Real-World Scenarios — Persona 1: Priya (Infant Vulnerability & Indoor Smog Defense)',
  () => {
    it('TC-PRIYA-01: infant member is assigned Tier 5 (Severe) risk under severe/winter smog baseline', async () => {
      // Authoritative source: docs/architecture.md §7.2, docs/prd.md §4, FR-4, AGENTS.md §B7
      // Priya's household has 4 members: 1 adult, 1 infant (sensitive), 2 seniors
      // In Delhi winter smog (AQI >= 300, base tier >= 4), infant gets bump = 1 -> tier = min(5, 4+1) = 5
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      expect(Array.isArray(data.plan.risks)).toBe(true);

      // Locate the infant member's risk profile
      const infantRisk = data.plan.risks.find(
        (r) => r.band === 'infant' || (r.sensitive === true && r.band !== 'senior')
      );
      expect(infantRisk, 'Infant risk assessment profile must be present').toBeDefined();
      expect(infantRisk?.tier, 'Infant must be assigned Tier 5 (Severe) vulnerability in winter smog').toBe(5);

      // Find an adult member to verify differential vulnerability
      const adultRisk = data.plan.risks.find((r) => r.band === 'adult');
      if (adultRisk) {
        expect(infantRisk!.tier).toBeGreaterThanOrEqual(adultRisk.tier);
      }

      // Plain language guidance must be present
      if (infantRisk?.message) {
        expect(typeof infantRisk.message).toBe('string');
        expect(infantRisk.message.length).toBeGreaterThan(0);
      }
    });

    it('TC-PRIYA-02: plan includes mandatory protective indoor actions (bedroom purifier or DIY box-fan filter)', async () => {
      // Authoritative source: docs/architecture.md §7.7, §7.8 ("always include protective actions when worst tier >= very-poor"), AGENTS.md §B7
      // Priya has no purifier (home.purifier = 'none') and mid budget
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      const allActions = data.plan.blocks.flatMap((b) => b.actions);
      expect(allActions.length, 'Plan must contain recommended actions').toBeGreaterThan(0);

      // Mandatory protective indoor action: bedroom air purifier or DIY box-fan filter
      const hasProtectiveAirCleaningAction = allActions.some((a) => {
        const idLower = a.id.toLowerCase();
        const titleStr = typeof a.title === 'string' ? a.title : JSON.stringify(a.title || '');
        const idMatch = idLower.includes('purifier') || idLower.includes('box-fan') || idLower.includes('filter');
        const titleMatch = /purifier|filter|box-fan/i.test(titleStr);
        return idMatch || titleMatch;
      });

      expect(
        hasProtectiveAirCleaningAction,
        'Expected plan to include bedroom purifier or DIY box-fan filter for infant protection'
      ).toBe(true);

      // Verify the recommended action is within Priya's mid budget
      const airCleaningAction = allActions.find(
        (a) =>
          a.id.toLowerCase().includes('purifier') ||
          a.id.toLowerCase().includes('box-fan') ||
          a.id.toLowerCase().includes('filter')
      );
      if (airCleaningAction && airCleaningAction.cost) {
        expect(['free', 'low', 'mid']).toContain(airCleaningAction.cost);
      }

      // Check for best-window ventilation guidance or best-window definition in plan
      const hasVentilationOrWindow =
        allActions.some((a) => {
          const text = `${a.id} ${JSON.stringify(a.title || '')}`.toLowerCase();
          return text.includes('window') || text.includes('ventilat');
        }) || Boolean(data.plan.window?.best);

      expect(
        hasVentilationOrWindow,
        'Plan must provide best-window ventilation advice or best-window schedule'
      ).toBe(true);
    });

    it('TC-PRIYA-03: golden snapshot matches expected actions and exposure reductions', async () => {
      // Authoritative source: docs/architecture.md §7.5, §7.8, §15, docs/prd.md FR-5, FR-8
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);

      // Verify baseline and planned exposure reduction
      if (data.plan.baseline !== undefined && data.plan.planned !== undefined) {
        expect(data.plan.baseline).toBeGreaterThan(0);
        expect(data.plan.planned).toBeGreaterThan(0);
        expect(data.plan.planned).toBeLessThan(data.plan.baseline);

        const reductionPct = ((data.plan.baseline - data.plan.planned) / data.plan.baseline) * 100;
        // Purifier overnight + indoor protections typically yield 15% to 60% exposure reduction
        expect(reductionPct).toBeGreaterThanOrEqual(15);
        expect(reductionPct).toBeLessThanOrEqual(65);
      }

      // Verify action catalog contract integrity for all selected actions
      const allActions = data.plan.blocks.flatMap((b) => b.actions);
      for (const action of allActions) {
        expect(typeof action.id).toBe('string');
        expect(action.id.length).toBeGreaterThan(0);

        if (action.effort !== undefined) {
          expect([1, 2, 3]).toContain(action.effort);
        }
        if (action.confidence !== undefined) {
          expect(['high', 'medium', 'low']).toContain(action.confidence);
        }
        if (action.cost !== undefined) {
          expect(['free', 'low', 'mid']).toContain(action.cost);
        }
      }

      // Verify narration exists and meta execution mode is valid
      expect(['ai', 'rules']).toContain(data.meta.mode);
      expect(data.narration).toBeDefined();
    });
  }
);
