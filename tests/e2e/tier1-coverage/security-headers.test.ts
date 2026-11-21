import { describe, it, expect } from 'vitest';
import { invokeMiddleware, apiRequest } from '../harness/client';

describe('Tier 1 Coverage — Security Headers & CSP Middleware', () => {
  it('TC-SEC-01: verifies presence of Content-Security-Policy header on middleware responses', async () => {
    // Authoritative source: docs/architecture.md §12
    const res = await invokeMiddleware('/');
    const csp = res.headers.get('content-security-policy') || res.headers.get('content-security-policy-report-only');
    expect(csp).toBeTruthy();
  });

  it('TC-SEC-02: verifies CSP includes script-src directive with cryptographic nonce', async () => {
    // Authoritative source: docs/architecture.md §12 ("strict CSP with nonces")
    const res = await invokeMiddleware('/');
    const csp = res.headers.get('content-security-policy') || res.headers.get('content-security-policy-report-only') || '';

    expect(csp).toContain('script-src');
    // Nonce format: 'nonce-[base64/hex]'
    const nonceMatch = csp.match(/'nonce-([a-zA-Z0-9+/=_-]+)'/);
    expect(nonceMatch).not.toBeNull();
    expect(nonceMatch![1].length).toBeGreaterThanOrEqual(16);
  });

  it('TC-SEC-03: enforces clickjacking protection via X-Frame-Options: DENY', async () => {
    // Authoritative source: docs/architecture.md §12
    const res = await invokeMiddleware('/');
    const xFrameOptions = res.headers.get('x-frame-options');
    expect(xFrameOptions).toBe('DENY');
  });

  it('TC-SEC-04: enforces MIME-sniffing protection via X-Content-Type-Options: nosniff', async () => {
    // Authoritative source: docs/architecture.md §12
    const res = await invokeMiddleware('/');
    const xContentTypeOptions = res.headers.get('x-content-type-options');
    expect(xContentTypeOptions).toBe('nosniff');
  });

  it('TC-SEC-05: verifies privacy headers (Referrer-Policy or Permissions-Policy)', async () => {
    // Authoritative source: docs/architecture.md §12
    // Referrer-Policy: no-referrer, Permissions-Policy: geolocation=(self)
    const res = await invokeMiddleware('/');
    const referrerPolicy = res.headers.get('referrer-policy');
    const permissionsPolicy = res.headers.get('permissions-policy');

    const hasPrivacyHeader = Boolean(
      (referrerPolicy && referrerPolicy === 'no-referrer') ||
      (permissionsPolicy && permissionsPolicy.includes('geolocation='))
    );
    expect(hasPrivacyHeader).toBe(true);
  });
});
