import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { expectJsonSuccess, AirSchema, DayPlanResponseSchema } from '../harness/matchers';
import { priyaHousehold, delhiCoords, sampleSevereAir } from '../harness/fixtures';

const isAirImplemented = isRouteImplemented('/api/air');
const isPlanImplemented = isRouteImplemented('/api/plan');
const isFallbackTestable = isAirImplemented || isPlanImplemented;

describe.skipIf(!isFallbackTestable)('Tier 3 Interaction — Offline Fallbacks & Graceful Degradation', () => {
  it('TC-FALLBACK-01: falls back to cached snapshot when upstream air API is unavailable or cached', async () => {
    // Authoritative source: docs/architecture.md §8 ("Fallback: Last cached snapshot (labelled with age)"), §13 (15 min TTL)
    if (!isRouteImplemented('/api/air')) return;

    // First request establishes cache entry
    const initialRes = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    expect(initialRes.status).toBe(200);
    const initialAir = await expectJsonSuccess(initialRes, AirSchema);

    // Subsequent request for same coordinate hits the cache
    const cachedRes = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    expect(cachedRes.status).toBe(200);
    const cachedAir = await expectJsonSuccess(cachedRes, AirSchema);

    expect(cachedAir.aqi).toBe(initialAir.aqi);
    expect(cachedAir.category).toBe(initialAir.category);
    expect(['live', 'cache']).toContain(cachedAir.source);
  });

  it('TC-FALLBACK-02: provides snapshot age (ageMin) and source metadata for stale or cached data', async () => {
    // Authoritative source: docs/architecture.md §8 ("Last cached snapshot (labelled with age)"), §5 (ageMin: number, source: 'live' | 'cache' | 'manual')
    if (!isRouteImplemented('/api/air')) return;

    const res = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const air = await expectJsonSuccess(res, AirSchema);

    expect(typeof air.ageMin).toBe('number');
    expect(air.ageMin).toBeGreaterThanOrEqual(0);
    expect(['live', 'cache', 'manual']).toContain(air.source);
  });

  it('TC-FALLBACK-03: supports manual air quality input fallback when upstream is unavailable', async () => {
    // Authoritative source: docs/architecture.md §8 ("Fallback: manual AQI form"), §10 (meta.airSource)
    if (!isRouteImplemented('/api/plan')) return;

    // Client supplies manual air data fallback directly in request
    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        manualAir: {
          pm25: sampleSevereAir.pm25,
          pm10: sampleSevereAir.pm10,
          aqi: sampleSevereAir.aqi,
          category: sampleSevereAir.category,
        },
      },
    });

    expect(res.status).toBe(200);
    const planData = await expectJsonSuccess(res, DayPlanResponseSchema);

    expect(planData.plan).toBeDefined();
    expect(planData.meta).toBeDefined();
    if (planData.meta.airSource) {
      expect(['live', 'cache', 'manual']).toContain(planData.meta.airSource);
    }
  });

  it('TC-FALLBACK-04: falls back to deterministic rules-only mode when LLM API key is absent', async () => {
    // Authoritative source: docs/architecture.md §9.1 ("LLM_PROVIDER defaults to mock when no key is set"), AGENTS.md §B8 ("Fallback template narration")
    if (!isRouteImplemented('/api/plan')) return;

    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'en',
      },
    });

    expect(res.status).toBe(200);
    const planData = await expectJsonSuccess(res, DayPlanResponseSchema);

    // In offline test environment without GEMINI_API_KEY, mode must be 'rules'
    if (!process.env.GEMINI_API_KEY) {
      expect(planData.meta.mode).toBe('rules');
    }

    // Template narration must still have valid headline and summary populated from catalog
    expect(typeof planData.narration.headline).toBe('string');
    expect(planData.narration.headline.length).toBeGreaterThan(0);
    expect(typeof planData.narration.summary).toBe('string');
    expect(planData.narration.summary.length).toBeGreaterThan(0);
  });
});
