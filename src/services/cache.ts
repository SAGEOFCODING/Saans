import type { Air } from '../domain/types';

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  expiresAt: number;
}

export interface StaleResult<T> {
  value: T;
  cachedAt: number;
  ageMin: number;
}

export interface CacheOptions {
  maxEntries?: number;
  defaultTtlMs?: number;
}

export class LruTtlCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 500;
    this.defaultTtlMs = options.defaultTtlMs ?? 15 * 60 * 1000;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;

    // Refresh LRU order by re-inserting
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  getStale(key: string): StaleResult<T> | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    const ageMin = Math.max(0, Math.round((Date.now() - entry.cachedAt) / 60000));
    return { value: entry.value, cachedAt: entry.cachedAt, ageMin };
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) this.map.delete(oldestKey);
    }

    const now = Date.now();
    const expiresAt = now + (ttlMs ?? this.defaultTtlMs);
    this.map.set(key, { value, cachedAt: now, expiresAt });
  }

  async coalesce<R>(key: string, fn: () => Promise<R>): Promise<R> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<R>;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.inFlight.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

export function coordsToKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export const airCache = new LruTtlCache<Air>({
  maxEntries: 500,
  defaultTtlMs: 15 * 60 * 1000,
});

export const planCache = new LruTtlCache<unknown>({
  maxEntries: 500,
  defaultTtlMs: 10 * 60 * 1000,
});
