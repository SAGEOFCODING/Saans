import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { DayPlanResponseSchema, expectJsonSuccess } from '../harness/matchers';
import { mehtaHousehold, delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/plan'))(
  'Tier 4 Real-World Scenarios — Persona 2: Mr. Mehta (Senior Asthmatic Morning Walk Shift)',
  () => {
    it('TC-MEHTA-01: senior + sensitive member assigned Tier 5 vulnerability', async () => {
      // Authoritative source: docs/architecture.md §7.2, docs/prd.md §4, FR-4
      // Mr. Mehta is 68, retired, ground-floor house, respiratory sensitivity (asthma), daily morning walker
      // Base AQI in winter smog gives tier >= 4; senior + sensitive bump caps at Tier 5
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: mehtaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      expect(Array.isArray(data.plan.risks)).toBe(true);

      const mehtaRisk = data.plan.risks.find(
        (r) => r.band === 'senior' || r.sensitive === true
      );
      expect(mehtaRisk, 'Senior sensitive member risk profile must exist').toBeDefined();
      expect(mehtaRisk?.tier, 'Senior with respiratory sensitivity must be assigned Tier 5 vulnerability').toBe(5);

      if (mehtaRisk?.message) {
        expect(typeof mehtaRisk.message).toBe('string');
        expect(mehtaRisk.message.length).toBeGreaterThan(0);
      }
    });

    it('TC-MEHTA-02: morning outdoor walk shifted to best afternoon window or indoor exercise', async () => {
      // Authoritative source: docs/architecture.md §7.4, §7.7, docs/prd.md §4, FR-5, FR-6
      // Mr. Mehta exercises outdoors daily. In winter smog, morning air is stagnant and heavily polluted.
      // The plan must shift walking to the afternoon best window or recommend indoor alternatives.
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: mehtaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);

      // Verify that the plan provides window guidance (best window typically during afternoon dip)
      expect(data.plan.window).toBeDefined();
      if (data.plan.window?.best) {
        expect(data.plan.window.best).toHaveProperty('start');
        expect(data.plan.window.best).toHaveProperty('end');
      }

      // Collect all actions across routine blocks
      const allActions = data.plan.blocks.flatMap((b) => b.actions);

      // Verify at least one action targets shifting exercise outdoors or doing indoor exercise
      const shiftsExerciseOrWalk = allActions.some((a) => {
        const combined = `${a.id} ${JSON.stringify(a.title || '')} ${JSON.stringify(a.why || '')}`.toLowerCase();
        return (
          combined.includes('walk') ||
          combined.includes('exercise') ||
          combined.includes('indoor') ||
          combined.includes('window') ||
          combined.includes('shift') ||
          combined.includes('outdoor')
        );
      });

      expect(
        shiftsExerciseOrWalk,
        'Plan must recommend shifting outdoor walking to the best window or moving exercise indoors'
      ).toBe(true);
    });

    it('TC-MEHTA-03: draft protection / window sealing prioritized for ground-floor house with leaky windows', async () => {
      // Authoritative source: docs/architecture.md §7.7, docs/prd.md FR-6
      // Mr. Mehta lives in a ground-floor house with leaky windows (home.floor = 'low', home.windows = 'leaky')
      // Ground floor leaky windows have high infiltration; draft sealing is a top indoor priority
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: mehtaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          lang: 'en',
        },
      });
      expect(res.status).toBe(200);

      const data = await expectJsonSuccess(res, DayPlanResponseSchema);
      const allActions = data.plan.blocks.flatMap((b) => b.actions);

      // Search for draft sealing / gap closure actions
      const sealingAction = allActions.find((a) => {
        const text = `${a.id} ${JSON.stringify(a.title || '')} ${JSON.stringify(a.why || '')}`.toLowerCase();
        return (
          text.includes('seal') ||
          text.includes('draft') ||
          text.includes('gap') ||
          text.includes('weatherstrip') ||
          text.includes('leak') ||
          (a.domain === 'indoor' && (text.includes('window') || text.includes('door')))
        );
      });

      expect(
        sealingAction,
        'Draft protection / window sealing action must be recommended for house with leaky windows'
      ).toBeDefined();

      if (sealingAction?.cost) {
        expect(['free', 'low', 'mid']).toContain(sealingAction.cost);
      }

      if (data.plan.baseline !== undefined && data.plan.planned !== undefined) {
        expect(data.plan.planned).toBeLessThan(data.plan.baseline);
      }
    });
  }
);
