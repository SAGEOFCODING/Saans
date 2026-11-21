import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthHandler } from '../../src/app/api/health/route';
import { GET as geocodeHandler } from '../../src/app/api/geocode/route';
import { GET as airHandler } from '../../src/app/api/air/route';
import { POST as planHandler } from '../../src/app/api/plan/route';
import { resetRateLimits } from '../../src/services/rateLimit';
import { airCache } from '../../src/services/cache';
import presetsData from '../../src/data/presets.json';

describe('API Route Handlers (src/app/api/*)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetRateLimits();
    airCache.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('GET /api/health', () => {
    it('returns HTTP 200 with ok, llm, and ISO timestamp', async () => {
      const res = await healthHandler();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(['mock', 'gemini']).toContain(body.llm);
      expect(typeof body.time).toBe('string');
      expect(Number.isNaN(Date.parse(body.time))).toBe(false);
    });
  });

  describe('GET /api/geocode', () => {
    it('returns HTTP 200 with geocoding results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              { name: 'Delhi', latitude: 28.65, longitude: 77.23, admin1: 'Delhi', country: 'India' },
            ],
          }),
          { status: 200 }
        )
      );

      const req = new NextRequest('http://localhost:3000/api/geocode?q=Delhi');
      const res = await geocodeHandler(req);
      expect(res.status).toBe(200);

      const results = await res.json();
      expect(Array.isArray(results)).toBe(true);
      expect(results[0].name).toBe('Delhi');
      expect(results[0].lat).toBe(28.65);
      expect(results[0].lon).toBe(77.23);
    });

    it('returns HTTP 400 for missing or empty query parameter q', async () => {
      const req = new NextRequest('http://localhost:3000/api/geocode?q=   ');
      const res = await geocodeHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('INVALID_QUERY');
    });

    it('returns HTTP 400 for query exceeding 80 characters', async () => {
      const longQ = 'A'.repeat(85);
      const req = new NextRequest(`http://localhost:3000/api/geocode?q=${longQ}`);
      const res = await geocodeHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('QUERY_TOO_LONG');
    });

    it('returns HTTP 429 when geocode rate limit (60/min) is exceeded', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), { status: 200 })
      );

      const ip = '10.20.30.40';
      let lastRes: Response | null = null;

      for (let i = 0; i < 65; i++) {
        const req = new NextRequest('http://localhost:3000/api/geocode?q=Delhi', {
          headers: { 'x-forwarded-for': ip },
        });
        lastRes = await geocodeHandler(req);
        if (lastRes.status === 429) break;
      }

      expect(lastRes?.status).toBe(429);
      expect(lastRes?.headers.get('retry-after')).toBeTruthy();
      const body = await lastRes?.json();
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/air', () => {
    it('returns HTTP 200 with Air snapshot for valid coordinates', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('air-quality')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                current: { time: '2026-11-21T10:00', pm2_5: 120, pm10: 190 },
                hourly: { time: ['2026-11-21T10:00'], pm2_5: [120], pm10: [190] },
              }),
              { status: 200 }
            )
          );
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              current: { temperature_2m: 22, relative_humidity_2m: 55, wind_speed_10m: 6.5, visibility: 5000 },
            }),
            { status: 200 }
          )
        );
      });

      const req = new NextRequest('http://localhost:3000/api/air?lat=28.61&lon=77.21');
      const res = await airHandler(req);
      expect(res.status).toBe(200);

      const air = await res.json();
      expect(air.pm25).toBe(120);
      expect(air.pm10).toBe(190);
      expect(air.aqi).toBeGreaterThan(0);
      expect(air.category).toBeDefined();
    });

    it('returns HTTP 400 for missing coordinate parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/air?lat=28.61');
      const res = await airHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('INVALID_COORDINATES');
    });

    it('returns HTTP 400 for out-of-range coordinates', async () => {
      const req = new NextRequest('http://localhost:3000/api/air?lat=95.0&lon=77.21');
      const res = await airHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('INVALID_COORDINATES');
    });
  });

  describe('POST /api/plan', () => {
    const manualAir = {
      pm25: 180,
      pm10: 270,
      aqi: 346,
      category: 'very-poor' as const,
    };

    it('generates valid plan and narration for all 4 presets (Priya, Mehta, Rohan, Anil)', async () => {
      const presets = [presetsData.priya, presetsData.mehta, presetsData.rohan, presetsData.anil];

      for (const preset of presets) {
        const req = new NextRequest('http://localhost:3000/api/plan', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            household: preset.household,
            location: { lat: 28.61, lon: 77.21 },
            manualAir,
            lang: 'en',
          }),
        });

        const res = await planHandler(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.plan).toBeDefined();
        expect(data.plan.blocks.length).toBeGreaterThan(0);
        expect(data.narration.headline).toBeDefined();
        expect(data.narration.summary).toBeDefined();
        expect(data.meta.mode).toBe('rules');
        expect(data.meta.airSource).toBe('manual');
      }
    });

    it('rejects request payloads exceeding 16 KB with HTTP 413', async () => {
      const padding = 'x'.repeat(17 * 1024);
      const req = new NextRequest('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          household: presetsData.priya.household,
          location: { lat: 28.61, lon: 77.21 },
          extra: padding,
        }),
      });

      const res = await planHandler(req);
      expect(res.status).toBe(413);

      const body = await res.json();
      expect(body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('rejects malformed JSON with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"household": [invalid json}',
      });

      const res = await planHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid household schema with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          household: {
            members: [], // Invalid: min 1 member required
            home: presetsData.priya.household.home,
            mobility: presetsData.priya.household.mobility,
            budget: 'free',
            lang: 'en',
          },
        }),
      });

      const res = await planHandler(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns Hindi localized narration with Devanagari script when lang=hi', async () => {
      const req = new NextRequest('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          household: { ...presetsData.priya.household, lang: 'hi' },
          location: { lat: 28.61, lon: 77.21 },
          manualAir,
          lang: 'hi',
        }),
      });

      const res = await planHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      const devanagariRegex = /[\u0900-\u097F]/;
      expect(data.narration.headline).toMatch(devanagariRegex);
      expect(data.narration.summary).toMatch(devanagariRegex);
    });

    it('returns HTTP 429 when plan rate limit (20/min) is exceeded', async () => {
      const ip = '10.50.60.70';
      let lastRes: Response | null = null;

      for (let i = 0; i < 25; i++) {
        const req = new NextRequest('http://localhost:3000/api/plan', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
          body: JSON.stringify({
            household: presetsData.priya.household,
            location: { lat: 28.61, lon: 77.21 },
            manualAir,
          }),
        });
        lastRes = await planHandler(req);
        if (lastRes.status === 429) break;
      }

      expect(lastRes?.status).toBe(429);
      expect(lastRes?.headers.get('retry-after')).toBeTruthy();
      const body = await lastRes?.json();
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
