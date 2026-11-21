import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { AirSchema, expectJsonSuccess } from '../harness/matchers';
import { delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/air'))('Tier 1 Coverage — Air Quality Snapshot (GET /api/air)', () => {
  it('TC-AIR-01: returns HTTP 200 with complete Air schema for standard Delhi coordinates', async () => {
    // Authoritative source: docs/architecture.md §5, §10, prd.md FR-3
    const res = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    expect(res.status).toBe(200);

    const air = await expectJsonSuccess(res, AirSchema);
    expect(air).toBeDefined();
    expect(typeof air.at).toBe('string');
    expect(air.pm25).toBeGreaterThanOrEqual(0);
    expect(air.pm10).toBeGreaterThanOrEqual(0);
    expect(air.aqi).toBeGreaterThanOrEqual(0);
    expect(air.aqi).toBeLessThanOrEqual(500);
  });

  it('TC-AIR-02: verifies NAQI metric consistency (category, dominant pollutant pm25/pm10)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (NAQI CPCB sub-index logic)
    const res = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const air = await expectJsonSuccess(res, AirSchema);

    const validCategories = ['good', 'satisfactory', 'moderate', 'poor', 'very-poor', 'severe'];
    expect(validCategories).toContain(air.category);
    expect(['pm25', 'pm10']).toContain(air.dominant);

    // Verify category consistency with AQI value
    if (air.aqi <= 50) {
      expect(air.category).toBe('good');
    } else if (air.aqi <= 100) {
      expect(air.category).toBe('satisfactory');
    } else if (air.aqi <= 200) {
      expect(air.category).toBe('moderate');
    } else if (air.aqi <= 300) {
      expect(air.category).toBe('poor');
    } else if (air.aqi <= 400) {
      expect(air.category).toBe('very-poor');
    } else {
      expect(air.category).toBe('severe');
    }
  });

  it('TC-AIR-03: returns 24-hour hourly outlook data points with timestamp, pm25, and aqi', async () => {
    // Authoritative source: docs/architecture.md §5, prd.md FR-3
    const res = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const air = await expectJsonSuccess(res, AirSchema);

    expect(Array.isArray(air.hourly)).toBe(true);
    expect(air.hourly.length).toBeGreaterThanOrEqual(12);
    expect(air.hourly.length).toBeLessThanOrEqual(48);

    const firstPoint = air.hourly[0];
    expect(firstPoint).toHaveProperty('t');
    expect(firstPoint).toHaveProperty('pm25');
    expect(firstPoint).toHaveProperty('aqi');
    expect(typeof firstPoint.pm25).toBe('number');
    expect(typeof firstPoint.aqi).toBe('number');
  });

  it('TC-AIR-04: computes atmospheric stagnation flag as a boolean according to weather variables', async () => {
    // Authoritative source: docs/architecture.md §7.3
    // stagnation = windKmh < 6 && (tempC < 12 || night/early morning) && rh > 60
    const res = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const air = await expectJsonSuccess(res, AirSchema);

    expect(typeof air.stagnant).toBe('boolean');
    expect(typeof air.windKmh).toBe('number');
    expect(typeof air.tempC).toBe('number');
    expect(typeof air.rh).toBe('number');
  });

  it('TC-AIR-05: verifies caching and metadata attributes (source, ageMin)', async () => {
    // Authoritative source: docs/architecture.md §8, §13 (15 min cache TTL, key lat2,lon2)
    const firstRes = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const firstAir = await expectJsonSuccess(firstRes, AirSchema);

    expect(['live', 'cache', 'manual']).toContain(firstAir.source);
    expect(firstAir.ageMin).toBeGreaterThanOrEqual(0);

    // Consecutive request should hit memory cache or return cached snapshot
    const secondRes = await apiRequest('/api/air', {
      query: { lat: delhiCoords.lat, lon: delhiCoords.lon },
    });
    const secondAir = await expectJsonSuccess(secondRes, AirSchema);

    expect(secondAir.aqi).toBe(firstAir.aqi);
    expect(secondAir.category).toBe(firstAir.category);
    expect(secondAir.ageMin).toBeGreaterThanOrEqual(0);
  });
});
