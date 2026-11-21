import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { expectJsonError } from '../harness/matchers';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

const isPlanImplemented = isRouteImplemented('/api/plan');
const isChatImplemented = isRouteImplemented('/api/chat');

describe.skipIf(!isPlanImplemented && !isChatImplemented)('Tier 2 Boundary — Token Bucket Rate Limiting', () => {
  it('TC-RATE-01: limits POST /api/plan requests exceeding 20 per minute from same IP with HTTP 429', async () => {
    // Authoritative source: docs/architecture.md §10, §12 ("In-memory token-bucket rate limit per IP: plan 20/min")
    if (!isRouteImplemented('/api/plan')) return;

    const testIp = '192.0.2.10';
    let limited = false;

    // Send up to 25 requests sequentially
    for (let i = 0; i < 25; i++) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        ip: testIp,
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        },
      });

      if (res.status === 429) {
        limited = true;
        break;
      }
    }

    expect(limited, 'Expected to encounter HTTP 429 after sending more than 20 requests within a minute').toBe(true);
  });

  it('TC-RATE-02: includes Retry-After header on 429 rate-limited response', async () => {
    // Authoritative source: docs/architecture.md §12, HTTP standard rate limiting RFC 6585
    if (!isRouteImplemented('/api/plan')) return;

    const testIp = '192.0.2.20';
    let rateLimitedRes: Response | null = null;

    for (let i = 0; i < 25; i++) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        ip: testIp,
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        },
      });

      if (res.status === 429) {
        rateLimitedRes = res;
        break;
      }
    }

    expect(rateLimitedRes, 'Expected at least one HTTP 429 response').not.toBeNull();
    if (rateLimitedRes) {
      expect(rateLimitedRes.status).toBe(429);
      const retryAfter = rateLimitedRes.headers.get('retry-after');
      expect(retryAfter, 'Expected Retry-After header on 429 response').toBeTruthy();
      const seconds = parseInt(retryAfter || '0', 10);
      expect(seconds).toBeGreaterThanOrEqual(1);
    }
  });

  it('TC-RATE-03: limits POST /api/chat requests exceeding 10 per minute from same IP with HTTP 429', async () => {
    // Authoritative source: docs/architecture.md §12 ("chat 10/min")
    if (!isRouteImplemented('/api/chat')) return;

    const testIp = '192.0.2.30';
    let chatLimited = false;

    // Send up to 15 requests sequentially
    for (let i = 0; i < 15; i++) {
      const res = await apiRequest('/api/chat', {
        method: 'POST',
        ip: testIp,
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
          messages: [{ role: 'user', content: 'Quick status check' }],
        },
      });

      if (res.status === 429) {
        chatLimited = true;
        break;
      }
    }

    expect(chatLimited, 'Expected POST /api/chat to return HTTP 429 after 10 requests').toBe(true);
  });

  it('TC-RATE-04: isolates rate limit buckets by IP address', async () => {
    // Authoritative source: docs/architecture.md §12 ("In-memory token-bucket rate limit per IP")
    if (!isRouteImplemented('/api/plan')) return;

    const ipA = '192.0.2.41';
    const ipB = '192.0.2.42';

    // Exhaust IP A
    for (let i = 0; i < 25; i++) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        ip: ipA,
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        },
      });
      if (res.status === 429) break;
    }

    // Immediate request from fresh IP B must succeed
    const resB = await apiRequest('/api/plan', {
      method: 'POST',
      ip: ipB,
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
      },
    });

    expect(resB.status).toBe(200);
  });

  it('TC-RATE-05: returns standard ErrorEnvelope format on rate limit rejection', async () => {
    // Authoritative source: docs/architecture.md §10 ("Errors are { error: { code, message } } with no stack traces")
    if (!isRouteImplemented('/api/plan')) return;

    const testIp = '192.0.2.50';
    let rateLimitedRes: Response | null = null;

    for (let i = 0; i < 25; i++) {
      const res = await apiRequest('/api/plan', {
        method: 'POST',
        ip: testIp,
        body: {
          household: priyaHousehold,
          location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        },
      });

      if (res.status === 429) {
        rateLimitedRes = res;
        break;
      }
    }

    expect(rateLimitedRes, 'Expected at least one HTTP 429 response').not.toBeNull();
    if (rateLimitedRes) {
      const err = await expectJsonError(rateLimitedRes, undefined, 429);
      expect(err.code).toMatch(/RATE_LIMIT|TOO_MANY_REQUESTS|RATE_LIMITED/i);
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }
  });
});
