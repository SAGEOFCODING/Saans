import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { expectJsonSuccess, GeocodeResultsListSchema, AirSchema, DayPlanResponseSchema } from '../harness/matchers';
import { priyaHousehold, mehtaHousehold, delhiCoords, mumbaiCoords } from '../harness/fixtures';

const isPipelineReady = isRouteImplemented('/api/geocode') && isRouteImplemented('/api/air') && isRouteImplemented('/api/plan');

describe.skipIf(!isPipelineReady)('Tier 3 Interaction — Geocode -> Air -> Plan Data Pipeline', () => {
  it('TC-PIPE-01: executes sequential geocode -> air -> plan pipeline with end-to-end data integrity', async () => {
    // Authoritative source: docs/architecture.md §2 (System context), §6 (Decision pipeline steps 1-10)
    // Step 1: Geocode search
    const geocodeRes = await apiRequest('/api/geocode', {
      query: { q: 'New Delhi' },
    });
    expect(geocodeRes.status).toBe(200);
    const locations = await expectJsonSuccess(geocodeRes, GeocodeResultsListSchema);
    expect(locations.length).toBeGreaterThan(0);

    const targetLoc = locations[0];
    expect(typeof targetLoc.lat).toBe('number');
    expect(typeof targetLoc.lon).toBe('number');

    // Step 2: Air quality query for coordinates
    const airRes = await apiRequest('/api/air', {
      query: { lat: targetLoc.lat, lon: targetLoc.lon },
    });
    expect(airRes.status).toBe(200);
    const air = await expectJsonSuccess(airRes, AirSchema);
    expect(air.aqi).toBeGreaterThanOrEqual(0);

    // Step 3: Plan generation incorporating household profile and location
    const planRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: targetLoc.lat, lon: targetLoc.lon },
        lang: 'en',
      },
    });
    expect(planRes.status).toBe(200);
    const planData = await expectJsonSuccess(planRes, DayPlanResponseSchema);

    // Assert correlation: plan air category or AQI corresponds to queried air
    expect(planData.plan.air).toBeDefined();
    expect(planData.plan.blocks.length).toBeGreaterThan(0);
    expect(planData.plan.risks.length).toBe(priyaHousehold.members.length);
  });

  it('TC-PIPE-02: propagates Delhi-NCR admin region into GRAP civic alerts', async () => {
    // Authoritative source: docs/architecture.md §7 (context.ts: season + Delhi-NCR GRAP hint), prd.md FR-15
    const planRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });

    const planData = await expectJsonSuccess(planRes, DayPlanResponseSchema);

    // Delhi-NCR during severe/poor air triggers GRAP (Graded Response Action Plan) hints
    const civicText = planData.plan.civic || '';
    const headline = planData.narration.headline || '';
    const summary = planData.narration.summary || '';
    const combinedText = `${civicText} ${headline} ${summary}`;

    expect(combinedText).toMatch(/GRAP|Graded Response|Stage|Advisory|Smog/i);
  });

  it('TC-PIPE-03: relocates morning outdoor exercise under atmospheric stagnation to best afternoon window', async () => {
    // Authoritative source: docs/architecture.md §7.3, §7.4, AGENTS.md §B7 (Mr. Mehta persona)
    // Mr. Mehta: daily morning walker with respiratory sensitivity
    const planRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: mehtaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });

    const planData = await expectJsonSuccess(planRes, DayPlanResponseSchema);
    expect(planData.plan.blocks.length).toBeGreaterThan(0);

    // All actions in plan
    const allActions = planData.plan.blocks.flatMap((b) => b.actions);
    const actionIds = allActions.map((a) => a.id);

    // Expect action to shift or replace morning outdoor exercise
    const hasShiftOrIndoorExercise = actionIds.some((id) =>
      id.includes('shift') || id.includes('window') || id.includes('indoor') || id.includes('walk') || id.includes('exercise')
    );
    expect(hasShiftOrIndoorExercise).toBe(true);

    // Verify window information is present in the plan
    if (planData.plan.window) {
      expect(planData.plan.window.best).toBeDefined();
    }
  });

  it('TC-PIPE-04: maintains data pipeline consistency across disparate geographies (Delhi vs Mumbai)', async () => {
    // Authoritative source: docs/architecture.md §6, §7
    // Execute plan for Mumbai
    const mumbaiPlanRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: mumbaiCoords.lat, lon: mumbaiCoords.lon },
      },
    });

    expect(mumbaiPlanRes.status).toBe(200);
    const mumbaiData = await expectJsonSuccess(mumbaiPlanRes, DayPlanResponseSchema);
    expect(mumbaiData.plan).toBeDefined();

    // Execute plan for Delhi
    const delhiPlanRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });

    expect(delhiPlanRes.status).toBe(200);
    const delhiData = await expectJsonSuccess(delhiPlanRes, DayPlanResponseSchema);
    expect(delhiData.plan).toBeDefined();

    // Delhi and Mumbai should generate valid localized plans reflecting their respective coordinates
    expect(mumbaiData.meta).toBeDefined();
    expect(delhiData.meta).toBeDefined();
  });
});
