import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAirData, synthesizeManualAir } from '../../src/services/airData';
import { airCache } from '../../src/services/cache';
import { AirSchema } from '../../src/domain/types';

describe('Air Quality Service (src/services/airData.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    airCache.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockAQ = {
    current: {
      time: '2026-11-21T08:00',
      pm2_5: 180,
      pm10: 270,
    },
    hourly: {
      time: ['2026-11-21T08:00', '2026-11-21T09:00'],
      pm2_5: [180, 190],
      pm10: [270, 280],
    },
  };

  const mockForecast = {
    current: {
      temperature_2m: 16.5,
      relative_humidity_2m: 75,
      wind_speed_10m: 4.2,
      visibility: 4200,
    },
  };

  it('TC-AIRDATA-01: successfully fetches and maps live air data to valid Air schema', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('air-quality')) {
        return Promise.resolve(new Response(JSON.stringify(mockAQ), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockForecast), { status: 200 }));
    });

    const air = await fetchAirData(28.6139, 77.209);
    expect(AirSchema.safeParse(air).success).toBe(true);
    expect(air.source).toBe('live');
    expect(air.pm25).toBe(180);
    expect(air.pm10).toBe(270);
    expect(air.visibilityKm).toBe(4.2);
    expect(air.windKmh).toBe(4.2);
    expect(air.tempC).toBe(16.5);
    expect(air.rh).toBe(75);
    expect(air.hourly.length).toBe(2);
  });

  it('TC-AIRDATA-02: gracefully degrades with default weather metrics if forecast fails', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('air-quality')) {
        return Promise.resolve(new Response(JSON.stringify(mockAQ), { status: 200 }));
      }
      return Promise.resolve(new Response('Internal Error', { status: 500 }));
    });

    const air = await fetchAirData(28.61, 77.21);
    expect(AirSchema.safeParse(air).success).toBe(true);
    expect(air.source).toBe('live');
    expect(air.pm25).toBe(180);
    expect(air.windKmh).toBe(5); // default fallback
    expect(air.tempC).toBe(20); // default fallback
  });

  it('TC-AIRDATA-03: serves subsequent request from memory cache', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('air-quality')) {
        return Promise.resolve(new Response(JSON.stringify(mockAQ), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockForecast), { status: 200 }));
    });
    globalThis.fetch = fetchMock;

    const first = await fetchAirData(28.61, 77.21);
    expect(first.source).toBe('live');

    const second = await fetchAirData(28.61, 77.21);
    expect(second.source).toBe('cache');
    expect(second.aqi).toBe(first.aqi);
    expect(fetchMock).toHaveBeenCalledTimes(2); // Only first call performed network fetches
  });

  it('TC-AIRDATA-04: falls back to stale cache when upstream AQ fails', async () => {
    // Populate cache with an entry
    airCache.set('28.61,77.21', {
      at: '2026-11-21T06:00',
      pm25: 150,
      pm10: 220,
      aqi: 323,
      category: 'very-poor',
      dominant: 'pm25',
      windKmh: 4,
      tempC: 15,
      rh: 80,
      stagnant: true,
      hourly: [],
      source: 'live',
      ageMin: 0,
    }, 10); // Expire after 10ms

    await new Promise((r) => setTimeout(r, 20));

    // Upstream fails
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('Gateway Timeout', { status: 504 }));

    const air = await fetchAirData(28.61, 77.21);
    expect(air.source).toBe('cache');
    expect(air.pm25).toBe(150);
    expect(air.ageMin).toBeGreaterThanOrEqual(0);
  });

  it('TC-AIRDATA-05: synthesizeManualAir produces valid Air object', () => {
    const manual = synthesizeManualAir(250, 350, { category: 'severe', aqi: 410 });
    const parsed = AirSchema.safeParse(manual);
    expect(parsed.success).toBe(true);
    expect(manual.source).toBe('manual');
    expect(manual.category).toBe('severe');
    expect(manual.aqi).toBe(410);
    expect(manual.hourly.length).toBe(24);
  });
});
