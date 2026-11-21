import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { GeocodeResultsListSchema, expectJsonSuccess } from '../harness/matchers';
import { securityPayloads } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/geocode'))('Tier 1 Coverage — Geocoding Search (GET /api/geocode)', () => {
  it('TC-GEO-01: searches for major city "Delhi" and returns HTTP 200 with result array', async () => {
    // Authoritative source: docs/architecture.md §10, prd.md FR-1
    const res = await apiRequest('/api/geocode', {
      query: { q: 'Delhi' },
    });
    expect(res.status).toBe(200);

    const data = await expectJsonSuccess(res, GeocodeResultsListSchema);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name.toLowerCase()).toContain('delhi');
  });

  it('TC-GEO-02: verifies all result fields conform to schema (name, lat, lon, optional admin)', async () => {
    // Authoritative source: docs/architecture.md §10
    const res = await apiRequest('/api/geocode', {
      query: { q: 'Mumbai' },
    });
    const data = await expectJsonSuccess(res, GeocodeResultsListSchema);

    for (const item of data) {
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.lat).toBe('number');
      expect(typeof item.lon).toBe('number');
      expect(item.lat).toBeGreaterThanOrEqual(-90);
      expect(item.lat).toBeLessThanOrEqual(90);
      expect(item.lon).toBeGreaterThanOrEqual(-180);
      expect(item.lon).toBeLessThanOrEqual(180);
      if (item.admin !== undefined) {
        expect(typeof item.admin).toBe('string');
      }
    }
  });

  it('TC-GEO-03: verifies coordinates are rounded to at most 2 decimal places for privacy', async () => {
    // Authoritative source: docs/architecture.md §1.4 ("Coordinates rounded"), prd.md FR-1
    const res = await apiRequest('/api/geocode', {
      query: { q: 'Bengaluru' },
    });
    const data = await expectJsonSuccess(res, GeocodeResultsListSchema);
    expect(data.length).toBeGreaterThan(0);

    for (const item of data) {
      const latStr = String(item.lat);
      const lonStr = String(item.lon);
      const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
      const lonDecimals = lonStr.includes('.') ? lonStr.split('.')[1].length : 0;
      expect(latDecimals).toBeLessThanOrEqual(2);
      expect(lonDecimals).toBeLessThanOrEqual(2);
    }
  });

  it('TC-GEO-04: limits maximum search results to at most 5 items', async () => {
    // Authoritative source: docs/architecture.md §8 ("<= 5 matches"), prd.md FR-1
    const res = await apiRequest('/api/geocode', {
      query: { q: 'India' },
    });
    const data = await expectJsonSuccess(res, GeocodeResultsListSchema);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  it('TC-GEO-05: returns empty array [] without 500 error for non-existent locality', async () => {
    // Authoritative source: docs/architecture.md §8, §10
    const res = await apiRequest('/api/geocode', {
      query: { q: securityPayloads.nonExistentLocality },
    });
    expect(res.status).toBe(200);

    const data = await expectJsonSuccess(res, GeocodeResultsListSchema);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
