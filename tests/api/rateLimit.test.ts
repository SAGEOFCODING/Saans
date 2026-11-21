import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  resetRateLimits,
  cleanupStaleBuckets,
} from '../../src/services/rateLimit';

describe('Token-Bucket Rate Limiter (src/services/rateLimit.ts)', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('TC-RATE-01: permits requests up to capacity and decrements remaining tokens', () => {
    const ip = '10.0.0.1';
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit(ip, 'testRoute', limit, 60000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(limit - 1 - i);
    }
  });

  it('TC-RATE-02: rejects request when token bucket is exhausted', () => {
    const ip = '10.0.0.2';
    const limit = 3;

    // Consume all 3 tokens
    checkRateLimit(ip, 'testRoute', limit, 60000);
    checkRateLimit(ip, 'testRoute', limit, 60000);
    checkRateLimit(ip, 'testRoute', limit, 60000);

    // 4th request must be rejected
    const denied = checkRateLimit(ip, 'testRoute', limit, 60000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetMs).toBeGreaterThan(0);
  });

  it('TC-RATE-03: refills tokens as time passes', async () => {
    const ip = '10.0.0.3';
    const limit = 2;
    const windowMs = 100; // Fast window for test

    checkRateLimit(ip, 'testFast', limit, windowMs);
    checkRateLimit(ip, 'testFast', limit, windowMs);

    const empty = checkRateLimit(ip, 'testFast', limit, windowMs);
    expect(empty.allowed).toBe(false);

    // Wait for full window refill
    await new Promise((resolve) => setTimeout(resolve, 120));

    const refilled = checkRateLimit(ip, 'testFast', limit, windowMs);
    expect(refilled.allowed).toBe(true);
  });

  it('TC-RATE-04: isolates token balances by IP address', () => {
    const limit = 2;
    checkRateLimit('1.1.1.1', 'route', limit, 60000);
    checkRateLimit('1.1.1.1', 'route', limit, 60000);

    // IP 1.1.1.1 exhausted
    expect(checkRateLimit('1.1.1.1', 'route', limit, 60000).allowed).toBe(false);

    // IP 2.2.2.2 still fresh
    expect(checkRateLimit('2.2.2.2', 'route', limit, 60000).allowed).toBe(true);
  });

  it('TC-RATE-05: cleans up stale buckets older than threshold', () => {
    checkRateLimit('old.ip', 'route', 10, 60000);
    cleanupStaleBuckets(-1); // Forces cutoff to be in the future, deleting everything
    // Fresh call starts with full tokens
    const res = checkRateLimit('old.ip', 'route', 10, 60000);
    expect(res.remaining).toBe(9);
  });

  it('TC-RATE-06: extracts client IP from headers accurately', () => {
    const req1 = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    expect(getClientIp(req1)).toBe('203.0.113.195');

    const req2 = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.4' },
    });
    expect(getClientIp(req2)).toBe('198.51.100.4');

    const req3 = new Request('http://localhost');
    expect(getClientIp(req3)).toBe('127.0.0.1');
  });

  it('TC-RATE-07: createRateLimitResponse builds HTTP 429 response with Retry-After header', async () => {
    const res = createRateLimitResponse({ allowed: false, remaining: 0, resetMs: 3500 });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('4');

    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.error.message).toContain('Too many requests');
  });
});
