export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    message?: string
  ) {
    super(message || `HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
  }
}

export interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string | URL,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { timeoutMs = 4000, retries = 1, retryDelayMs = 250, ...fetchOpts } = options;
  const urlStr = typeof url === 'string' ? url : url.toString();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);

    try {
      const response = await fetch(urlStr, {
        ...fetchOpts,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      // Retry only on 5xx server errors, not on 4xx client errors
      if (response.status >= 500 && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      throw new HttpError(response.status, response.statusText, urlStr);
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message.includes('timed out'));
      const isNetwork = err instanceof TypeError;

      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries && (isAbort || isNetwork)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error(`Failed to fetch ${urlStr} after ${retries + 1} attempts`);
}
