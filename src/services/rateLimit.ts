export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const DEFAULT_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  plan: { limit: 20, windowMs: 60000 },
  chat: { limit: 10, windowMs: 60000 },
  geocode: { limit: 60, windowMs: 60000 },
  air: { limit: 60, windowMs: 60000 },
};

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export function checkRateLimit(
  ip: string,
  route: string,
  customLimit?: number,
  customWindowMs?: number
): RateLimitResult {
  if (buckets.size > 2000) cleanupStaleBuckets();

  const config = DEFAULT_LIMITS[route] || { limit: 60, windowMs: 60000 };
  const limit = customLimit ?? config.limit;
  const windowMs = customWindowMs ?? config.windowMs;
  const bucketKey = `${route}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(bucketKey, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  const refillTokens = elapsed * (limit / windowMs);
  bucket.tokens = Math.min(limit, bucket.tokens + refillTokens);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetMs: Math.ceil(((limit - bucket.tokens) / limit) * windowMs),
    };
  }

  const waitMs = Math.ceil(((1 - bucket.tokens) / limit) * windowMs);
  return {
    allowed: false,
    remaining: 0,
    resetMs: Math.max(1000, waitMs),
  };
}

export function createRateLimitResponse(result: RateLimitResult, message?: string): Response {
  const seconds = Math.max(1, Math.ceil(result.resetMs / 1000));
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests. Please try again later.',
      },
    }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(seconds),
      },
    }
  );
}

export function cleanupStaleBuckets(maxAgeMs = 120000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < cutoff) {
      buckets.delete(key);
    }
  }
}

export function resetRateLimits(): void {
  buckets.clear();
}
