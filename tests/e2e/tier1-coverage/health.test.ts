import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented } from '../harness/client';
import { HealthResponseSchema, expectJsonSuccess } from '../harness/matchers';

describe.skipIf(!isRouteImplemented('/api/health'))('Tier 1 Coverage — Health Check (GET /api/health)', () => {
  it('TC-HEALTH-01: returns HTTP 200 with ok=true envelope', async () => {
    // Authoritative source: docs/architecture.md §10
    const res = await apiRequest('/api/health');
    expect(res.status).toBe(200);

    const data = await expectJsonSuccess(res, HealthResponseSchema);
    expect(data.ok).toBe(true);
  });

  it('TC-HEALTH-02: reports active LLM provider as mock or gemini', async () => {
    // Authoritative source: docs/architecture.md §9.1, §10
    const res = await apiRequest('/api/health');
    expect(res.status).toBe(200);

    const data = await expectJsonSuccess(res, HealthResponseSchema);
    expect(['mock', 'gemini']).toContain(data.llm);
  });

  it('TC-HEALTH-03: returns a valid ISO-8601 server timestamp in time field', async () => {
    // Authoritative source: docs/architecture.md §10
    const res = await apiRequest('/api/health');
    const data = await expectJsonSuccess(res, HealthResponseSchema);

    expect(typeof data.time).toBe('string');
    const parsedTime = Date.parse(data.time);
    expect(Number.isNaN(parsedTime)).toBe(false);
    // Timestamp should be recent (within the last hour)
    const diffMs = Math.abs(Date.now() - parsedTime);
    expect(diffMs).toBeLessThan(3600 * 1000);
  });

  it('TC-HEALTH-04: responds with application/json content-type header', async () => {
    // Authoritative source: docs/architecture.md §10
    const res = await apiRequest('/api/health');
    const contentType = res.headers.get('content-type');
    expect(contentType).toBeTruthy();
    expect(contentType?.toLowerCase()).toContain('application/json');
  });

  it('TC-HEALTH-05: disallows unsupported HTTP methods with HTTP 405 Method Not Allowed', async () => {
    // Authoritative source: Next.js App Router HTTP method dispatch contract & architecture.md §10
    const postRes = await apiRequest('/api/health', { method: 'POST', body: { ping: true } });
    expect(postRes.status).toBe(405);

    const allowHeader = postRes.headers.get('allow');
    if (allowHeader) {
      expect(allowHeader).toContain('GET');
    }
  });
});
