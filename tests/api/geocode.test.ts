import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchLocality } from '../../src/services/geocode';

describe('Geocoding Service (src/services/geocode.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockResults = {
    results: [
      { name: 'Delhi', latitude: 28.65195, longitude: 77.23149, admin1: 'Delhi', country: 'India' },
      { name: 'New Delhi', latitude: 28.61393, longitude: 77.20902, admin1: 'Delhi', country: 'India' },
      { name: 'Delhi Cantonment', latitude: 28.5901, longitude: 77.132, admin1: 'Delhi', country: 'India' },
      { name: 'North Delhi', latitude: 28.75, longitude: 77.15, admin1: 'Delhi', country: 'India' },
      { name: 'South Delhi', latitude: 28.5, longitude: 77.2, admin1: 'Delhi', country: 'India' },
      { name: 'Extra Item', latitude: 28.0, longitude: 77.0, admin1: 'Delhi', country: 'India' },
    ],
  };

  it('TC-GEOCODE-01: returns <= 5 matches with coordinates rounded to 2 decimal places', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResults), { status: 200 })
    );

    const results = await searchLocality('Delhi');
    expect(results.length).toBe(5); // sliced to at most 5

    for (const item of results) {
      const latStr = String(item.lat);
      const lonStr = String(item.lon);
      const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
      const lonDecimals = lonStr.includes('.') ? lonStr.split('.')[1].length : 0;
      expect(latDecimals).toBeLessThanOrEqual(2);
      expect(lonDecimals).toBeLessThanOrEqual(2);
    }

    expect(results[0].name).toBe('Delhi');
    expect(results[0].admin).toBe('Delhi, India');
    expect(results[0].lat).toBe(28.65);
    expect(results[0].lon).toBe(77.23);
  });

  it('TC-GEOCODE-02: returns [] for empty or whitespace query without network call', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    expect(await searchLocality('')).toEqual([]);
    expect(await searchLocality('   ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TC-GEOCODE-03: returns [] for query > 80 chars without network call', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const longQ = 'A'.repeat(81);
    expect(await searchLocality(longQ)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TC-GEOCODE-04: returns [] when results is undefined in upstream response or fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ generationtime_ms: 0.1 }), { status: 200 })
    );
    expect(await searchLocality('UnknownLocality123')).toEqual([]);

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    expect(await searchLocality('AnyCity')).toEqual([]);
  });
});
