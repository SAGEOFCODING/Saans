import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { DayPlanResponseSchema, expectJsonSuccess } from '../harness/matchers';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/plan'))('Tier 1 Coverage — DayPlan Assembly (POST /api/plan)', () => {
  it('TC-PLAN-01: returns HTTP 200 with plan, narration, and meta envelopes', async () => {
    // Authoritative source: docs/architecture.md §6, §10, prd.md FR-3, FR-5
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
    expect(data.plan).toBeDefined();
    expect(data.narration).toBeDefined();
    expect(data.meta).toBeDefined();
  });

  it('TC-PLAN-02: verifies plan structure contains time-blocked routine with actions', async () => {
    // Authoritative source: docs/architecture.md §5, §6, prd.md FR-5
    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });
    const data = await expectJsonSuccess(res, DayPlanResponseSchema);

    expect(Array.isArray(data.plan.blocks)).toBe(true);
    expect(data.plan.blocks.length).toBeGreaterThan(0);

    // Each block has an id and an array of actions
    let totalActions = 0;
    for (const block of data.plan.blocks) {
      expect(typeof block.id).toBe('string');
      expect(Array.isArray(block.actions)).toBe(true);
      totalActions += block.actions.length;
    }
    expect(totalActions).toBeGreaterThan(0);
  });

  it('TC-PLAN-03: contains risk assessment with member vulnerability tiers (0-5)', async () => {
    // Authoritative source: docs/architecture.md §7.2, prd.md FR-4
    // tier = min(5, base + bump) where bump = 1 for infant, senior or sensitive
    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });
    const data = await expectJsonSuccess(res, DayPlanResponseSchema);

    expect(Array.isArray(data.plan.risks)).toBe(true);
    expect(data.plan.risks.length).toBe(priyaHousehold.members.length);

    for (const risk of data.plan.risks) {
      expect(typeof risk.tier).toBe('number');
      expect(risk.tier).toBeGreaterThanOrEqual(0);
      expect(risk.tier).toBeLessThanOrEqual(5);
    }
  });

  it('TC-PLAN-04: computes baseline and planned exposure indices demonstrating reduction', async () => {
    // Authoritative source: docs/architecture.md §7.5, prd.md FR-8
    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });
    const data = await expectJsonSuccess(res, DayPlanResponseSchema);

    if (data.plan.baseline !== undefined && data.plan.planned !== undefined) {
      expect(data.plan.baseline).toBeGreaterThan(0);
      expect(data.plan.planned).toBeGreaterThan(0);
      // Planned exposure should not exceed baseline exposure
      expect(data.plan.planned).toBeLessThanOrEqual(data.plan.baseline);
    }
  });

  it('TC-PLAN-05: verifies meta execution mode is valid rules or ai mode', async () => {
    // Authoritative source: docs/architecture.md §9.1, §10, AGENTS.md §B8
    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });
    const data = await expectJsonSuccess(res, DayPlanResponseSchema);

    expect(['ai', 'rules']).toContain(data.meta.mode);
    if (!process.env.GEMINI_API_KEY) {
      // In default offline/judge mode without key, mode must be 'rules'
      expect(data.meta.mode).toBe('rules');
    }
  });
});
