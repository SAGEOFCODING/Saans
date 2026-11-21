import { z } from 'zod';
import { expect } from 'vitest';

/**
 * Zod schema for Air snapshot per architecture.md §5, §8, §10.
 */
export const AirCategorySchema = z.enum([
  'good',
  'satisfactory',
  'moderate',
  'poor',
  'very-poor',
  'severe',
]);

export const HourlyPointSchema = z.object({
  t: z.string(),
  pm25: z.number(),
  aqi: z.number(),
});

export const AirSchema = z.object({
  at: z.string(),
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative(),
  aqi: z.number().min(0).max(500),
  category: AirCategorySchema,
  dominant: z.enum(['pm25', 'pm10']),
  visibilityKm: z.number().optional(),
  windKmh: z.number(),
  tempC: z.number(),
  rh: z.number(),
  stagnant: z.boolean(),
  hourly: z.array(HourlyPointSchema),
  source: z.enum(['live', 'cache', 'manual']),
  ageMin: z.number(),
});

/**
 * Zod schema for Geocode result per architecture.md §8, §10.
 */
export const GeocodeResultSchema = z.object({
  name: z.string().min(1),
  admin: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const GeocodeResultsListSchema = z.array(GeocodeResultSchema);

/**
 * Zod schema for Health check endpoint per architecture.md §10.
 */
export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  llm: z.enum(['gemini', 'mock']),
  time: z.string(),
});

/**
 * Zod schema for standard error envelopes per architecture.md §10.
 * Error shape: { error: { code, message } } with no stack traces.
 */
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }).strict(),
}).strict();

/**
 * Zod schema for Action item inside DayPlan.
 */
export const ChosenActionSchema = z.object({
  id: z.string().min(1),
  domain: z.enum(['indoor', 'commute', 'cooking', 'heating', 'community', 'habit']).optional(),
  title: z.union([z.string(), z.record(z.string())]).optional(),
  why: z.union([z.string(), z.record(z.string())]).optional(),
  impact: z.object({
    exposureDeltaPct: z.number().optional(),
    co2eKgDay: z.number().optional(),
    pmTier: z.enum(['high', 'medium', 'low']).optional(),
  }).optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  effort: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  cost: z.enum(['free', 'low', 'mid']).optional(),
});

export const BlockSchema = z.object({
  id: z.string().min(1),
  span: z.any().optional(),
  env: z.string().optional(),
  actions: z.array(ChosenActionSchema),
});

export const MemberRiskSchema = z.object({
  band: z.string().optional(),
  tier: z.number().min(0).max(5),
  message: z.string().optional(),
  sensitive: z.boolean().optional(),
});

export const DayPlanSchema = z.object({
  air: AirSchema,
  risks: z.array(MemberRiskSchema),
  blocks: z.array(BlockSchema),
  baseline: z.number().optional(),
  planned: z.number().optional(),
  window: z.object({
    best: z.any(),
    worst: z.any(),
  }).optional(),
  civic: z.string().optional(),
  season: z.string().optional(),
});

export const DayPlanResponseSchema = z.object({
  plan: DayPlanSchema,
  narration: z.union([
    z.object({
      headline: z.string(),
      summary: z.string(),
      blocks: z.array(z.any()).optional(),
      actions: z.array(z.any()).optional(),
      watchouts: z.array(z.string()).optional(),
    }),
    z.record(z.any()),
  ]),
  meta: z.object({
    mode: z.enum(['ai', 'rules']),
    airSource: z.string().optional(),
    generatedAt: z.string().optional(),
  }),
});

/**
 * Assertion helper for verifying security headers per architecture.md §12.
 */
export function assertSecurityHeaders(headers: Headers): void {
  // X-Frame-Options: DENY
  const frameOptions = headers.get('x-frame-options');
  expect(frameOptions, 'Expected X-Frame-Options to be DENY').toBe('DENY');

  // X-Content-Type-Options: nosniff
  const contentTypeOptions = headers.get('x-content-type-options');
  expect(contentTypeOptions, 'Expected X-Content-Type-Options to be nosniff').toBe('nosniff');

  // Content-Security-Policy with script-src nonce
  const csp = headers.get('content-security-policy') || headers.get('content-security-policy-report-only');
  expect(csp, 'Expected Content-Security-Policy header to be present').toBeTruthy();
  expect(
    csp,
    'Expected CSP to contain script-src directive'
  ).toContain('script-src');

  // Referrer-Policy or Permissions-Policy
  const referrer = headers.get('referrer-policy');
  if (referrer) {
    expect(referrer).toBe('no-referrer');
  }
}

/**
 * Validates JSON response against Zod schema and returns parsed typed data.
 */
export async function expectJsonSuccess<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  expect(
    response.ok,
    `Expected HTTP 2xx status, got ${response.status} (${response.statusText})`
  ).toBe(true);

  const contentType = response.headers.get('content-type') || '';
  expect(contentType, `Expected application/json content-type, got ${contentType}`).toContain(
    'application/json'
  );

  const rawJson = await response.json();
  const parsed = schema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error(
      `Response JSON failed schema validation: ${JSON.stringify(parsed.error.format(), null, 2)}\nReceived: ${JSON.stringify(rawJson, null, 2)}`
    );
  }
  return parsed.data;
}

/**
 * Validates error response envelope against { error: { code, message } } per architecture.md §10.
 */
export async function expectJsonError(
  response: Response,
  expectedCode?: string,
  expectedStatus?: number
): Promise<{ code: string; message: string }> {
  if (expectedStatus !== undefined) {
    expect(
      response.status,
      `Expected HTTP status ${expectedStatus}, got ${response.status}`
    ).toBe(expectedStatus);
  } else {
    expect(
      response.ok,
      `Expected non-2xx error status, got ${response.status}`
    ).toBe(false);
  }

  const rawJson = await response.json();
  const parsed = ErrorEnvelopeSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error(
      `Error response does not match error envelope: ${JSON.stringify(rawJson, null, 2)}`
    );
  }

  if (expectedCode) {
    expect(parsed.data.error.code).toBe(expectedCode);
  }

  return parsed.data.error;
}
