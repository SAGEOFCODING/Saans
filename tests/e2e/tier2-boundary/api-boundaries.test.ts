import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { expectJsonError, expectJsonSuccess, DayPlanResponseSchema, AirSchema, GeocodeResultsListSchema } from '../harness/matchers';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

const isPlanOrAirImplemented = isRouteImplemented('/api/plan') || isRouteImplemented('/api/air');

describe.skipIf(!isPlanOrAirImplemented)('Tier 2 Boundary — API Boundaries & Input Validation', () => {
  it('TC-BOUND-01: rejects request body exceeding 16 KB with HTTP 413 or 400', async () => {
    // Authoritative source: docs/architecture.md §10 ("All bodies ≤ 16 KB"), §12 ("body size limits")
    if (!isRouteImplemented('/api/plan')) return;

    // Generate large padding string > 16 KB (18 KB = 18 * 1024 bytes)
    const padding = 'x'.repeat(18 * 1024);
    const oversizedPayload = {
      household: priyaHousehold,
      location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      lang: 'en',
      extraData: padding,
    };

    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: oversizedPayload,
    });

    expect([400, 413]).toContain(res.status);
    const err = await expectJsonError(res);
    expect(err.code).toMatch(/TOO_LARGE|PAYLOAD_TOO_LARGE|BODY_TOO_LARGE|VALIDATION_ERROR|BAD_REQUEST/i);
  });

  it('TC-BOUND-02: rejects out-of-bounds latitude (< -90 or > 90)', async () => {
    // Authoritative source: docs/architecture.md §10 ("numbers in India-plus bounds or global valid range"), §12 ("lat/lon bounds")
    // Test upper bound violation (lat > 90)
    if (isRouteImplemented('/api/air')) {
      const upperRes = await apiRequest('/api/air', {
        query: { lat: 95.5, lon: delhiCoords.lon },
      });
      expect(upperRes.status).toBe(400);
      const upperErr = await expectJsonError(upperRes);
      expect(upperErr.code).toBeDefined();

      // Test lower bound violation (lat < -90)
      const lowerRes = await apiRequest('/api/air', {
        query: { lat: -95.0, lon: delhiCoords.lon },
      });
      expect(lowerRes.status).toBe(400);
      const lowerErr = await expectJsonError(lowerRes);
      expect(lowerErr.code).toBeDefined();
    }

    if (isRouteImplemented('/api/plan')) {
      const planRes = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: priyaHousehold,
          location: { lat: 91.0, lon: delhiCoords.lon },
        },
      });
      expect(planRes.status).toBe(400);
      await expectJsonError(planRes);
    }
  });

  it('TC-BOUND-03: rejects out-of-bounds longitude (< -180 or > 180)', async () => {
    // Authoritative source: docs/architecture.md §10, §12 ("lat/lon bounds")
    // Test upper bound violation (lon > 180)
    if (isRouteImplemented('/api/air')) {
      const upperRes = await apiRequest('/api/air', {
        query: { lat: delhiCoords.lat, lon: 185.5 },
      });
      expect(upperRes.status).toBe(400);
      const upperErr = await expectJsonError(upperRes);
      expect(upperErr.code).toBeDefined();

      // Test lower bound violation (lon < -180)
      const lowerRes = await apiRequest('/api/air', {
        query: { lat: delhiCoords.lat, lon: -195.0 },
      });
      expect(lowerRes.status).toBe(400);
      const lowerErr = await expectJsonError(lowerRes);
      expect(lowerErr.code).toBeDefined();
    }

    if (isRouteImplemented('/api/plan')) {
      const planRes = await apiRequest('/api/plan', {
        method: 'POST',
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: 182.0 },
        },
      });
      expect(planRes.status).toBe(400);
      await expectJsonError(planRes);
    }
  });

  it('TC-BOUND-04: rejects malformed JSON request body with HTTP 400', async () => {
    // Authoritative source: docs/architecture.md §10 ("Zod-validate every boundary... error shape { error: { code, message } }")
    if (isRouteImplemented('/api/plan')) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"household": {"members": [}, "invalidJson": true',
      });

      expect(res.status).toBe(400);
      const err = await expectJsonError(res);
      expect(err.code).toMatch(/MALFORMED_JSON|BAD_REQUEST|VALIDATION_ERROR|PARSE_ERROR/i);
    }
  });

  it('TC-BOUND-05: rejects geocoding query string exceeding 80 characters limit', async () => {
    // Authoritative source: docs/architecture.md §10 ("GET /api/geocode?q= query ≤80 chars")
    if (!isRouteImplemented('/api/geocode')) return;

    // 85 character query string
    const longQuery = 'A'.repeat(85);
    const resOver = await apiRequest('/api/geocode', {
      query: { q: longQuery },
    });

    expect(resOver.status).toBe(400);
    const err = await expectJsonError(resOver);
    expect(err.code).toMatch(/QUERY_TOO_LONG|VALIDATION_ERROR|BAD_REQUEST/i);

    // Exactly 80 chars should be accepted (not rejected for length)
    const valid80CharQuery = 'A'.repeat(80);
    const resValid = await apiRequest('/api/geocode', {
      query: { q: valid80CharQuery },
    });
    // Expected to either return empty list 200 or not reject with length validation error
    if (resValid.status === 200) {
      await expectJsonSuccess(resValid, GeocodeResultsListSchema);
    } else {
      expect(resValid.status).not.toBe(413);
    }
  });

  it('TC-BOUND-06: accepts high-precision floating point coordinates gracefully', async () => {
    // Authoritative source: docs/architecture.md §12 ("Privacy: Coordinates rounded to 2 dp")
    if (!isRouteImplemented('/api/air')) return;

    // High precision coordinates with 11 decimal places
    const highPrecisionLat = 28.61393847294;
    const highPrecisionLon = 77.20902123847;

    const res = await apiRequest('/api/air', {
      query: { lat: highPrecisionLat, lon: highPrecisionLon },
    });

    expect(res.status).toBe(200);
    const air = await expectJsonSuccess(res, AirSchema);
    expect(air).toBeDefined();
    expect(air.aqi).toBeGreaterThanOrEqual(0);
  });
});
