import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry, HttpError } from '../../src/lib/http';

describe('Resilient HTTP Client (src/lib/http.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('TC-HTTP-01: returns response on 200 OK without retrying', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    globalThis.fetch = mockFetch;

    const res = await fetchWithRetry('https://example.com/api', { retries: 1 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('TC-HTTP-02: times out and triggers abort error if response hangs', async () => {
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_, reject) => {
        opts.signal.addEventListener('abort', () => {
          reject(new Error('Request timed out'));
        });
      });
    });
    globalThis.fetch = mockFetch;

    await expect(
      fetchWithRetry('https://example.com/api', { timeoutMs: 50, retries: 0 })
    ).rejects.toThrow('timed out');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('TC-HTTP-03: retries on 503 and succeeds on second attempt', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' }))
      .mockResolvedValueOnce(new Response('{"data":"recovered"}', { status: 200 }));
    globalThis.fetch = mockFetch;

    const res = await fetchWithRetry('https://example.com/api', { retries: 1, retryDelayMs: 10 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('TC-HTTP-04: throws HttpError after retries are exhausted on 500 error', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Server Error', { status: 500, statusText: 'Internal Server Error' })
    );
    globalThis.fetch = mockFetch;

    await expect(
      fetchWithRetry('https://example.com/api', { retries: 1, retryDelayMs: 10 })
    ).rejects.toThrow(HttpError);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('TC-HTTP-05: does not retry on 400 Bad Request or 404 Not Found', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' })
    );
    globalThis.fetch = mockFetch;

    await expect(
      fetchWithRetry('https://example.com/api', { retries: 1, retryDelayMs: 10 })
    ).rejects.toThrow(HttpError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('TC-HTTP-06: retries on network error (TypeError) and succeeds on retry', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    globalThis.fetch = mockFetch;

    const res = await fetchWithRetry('https://example.com/api', { retries: 1, retryDelayMs: 10 });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
