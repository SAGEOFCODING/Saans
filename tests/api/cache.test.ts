import { describe, it, expect, vi } from 'vitest';
import { LruTtlCache, coordsToKey } from '../../src/services/cache';

describe('LRU & TTL Cache (src/services/cache.ts)', () => {
  it('TC-CACHE-01: stores and retrieves item within TTL', () => {
    const cache = new LruTtlCache<string>({ defaultTtlMs: 5000 });
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.size).toBe(1);
  });

  it('TC-CACHE-02: returns undefined for expired item via get()', async () => {
    const cache = new LruTtlCache<string>({ defaultTtlMs: 20 });
    cache.set('key1', 'value1', 20);

    expect(cache.get('key1')).toBe('value1');
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(cache.get('key1')).toBeUndefined();
  });

  it('TC-CACHE-03: returns stale entry with calculated ageMin via getStale()', async () => {
    const cache = new LruTtlCache<string>({ defaultTtlMs: 20 });
    cache.set('key1', 'value1', 20);

    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(cache.get('key1')).toBeUndefined();

    const stale = cache.getStale('key1');
    expect(stale).toBeDefined();
    expect(stale?.value).toBe('value1');
    expect(stale?.ageMin).toBeGreaterThanOrEqual(0);
  });

  it('TC-CACHE-04: evicts least recently used entry when maxEntries is reached', () => {
    const cache = new LruTtlCache<string>({ maxEntries: 3, defaultTtlMs: 60000 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Access 'a' to make 'b' the oldest
    cache.get('a');

    // Add 'd', which should evict 'b'
    cache.set('d', '4');

    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe('3');
    expect(cache.get('d')).toBe('4');
    expect(cache.size).toBe(3);
  });

  it('TC-CACHE-05: deduplicates concurrent requests via coalesce()', async () => {
    const cache = new LruTtlCache<string>();
    let executionCount = 0;

    const slowFetcher = async () => {
      executionCount++;
      await new Promise((resolve) => setTimeout(resolve, 40));
      return 'fetched-data';
    };

    // Trigger 4 concurrent coalesced calls
    const results = await Promise.all([
      cache.coalesce('flight-key', slowFetcher),
      cache.coalesce('flight-key', slowFetcher),
      cache.coalesce('flight-key', slowFetcher),
      cache.coalesce('flight-key', slowFetcher),
    ]);

    expect(results).toEqual(['fetched-data', 'fetched-data', 'fetched-data', 'fetched-data']);
    expect(executionCount).toBe(1);
  });

  it('TC-CACHE-06: coordsToKey formats lat and lon to 2 decimal places', () => {
    expect(coordsToKey(28.6139, 77.209)).toBe('28.61,77.21');
    expect(coordsToKey(19.076, 72.8777)).toBe('19.08,72.88');
    expect(coordsToKey(0, 0)).toBe('0.00,0.00');
  });

  it('TC-CACHE-07: delete and clear methods update cache state properly', () => {
    const cache = new LruTtlCache<string>();
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    expect(cache.size).toBe(2);

    expect(cache.delete('k1')).toBe(true);
    expect(cache.get('k1')).toBeUndefined();
    expect(cache.size).toBe(1);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('k2')).toBeUndefined();
  });
});
