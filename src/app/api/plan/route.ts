import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HouseholdSchema, LocationSchema, AirCategorySchema } from '@/domain/types';
import { assembleDayPlan } from '@/domain/plan';
import { fetchAirData, synthesizeManualAir } from '@/services/airData';
import { narratePlan } from '@/services/llm/narrate';
import { checkRateLimit, getClientIp } from '@/services/rateLimit';

const PlanRequestSchema = z.object({
  household: HouseholdSchema,
  location: LocationSchema.optional().default({ lat: 28.61, lon: 77.21 }),
  lang: z.enum(['en', 'hi']).default('en'),
  manualAir: z
    .object({
      pm25: z.number().nonnegative(),
      pm10: z.number().nonnegative().optional(),
      aqi: z.number().min(0).max(500).optional(),
      category: AirCategorySchema.optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, 'plan', 20, 60000);

  if (!rate.allowed) {
    const seconds = Math.max(1, Math.ceil(rate.resetMs / 1000));
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded for daily plan generation' } },
      { status: 429, headers: { 'Retry-After': String(seconds) } }
    );
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Failed to read request body' } },
      { status: 400 }
    );
  }

  if (rawText.length > 16384) {
    return NextResponse.json(
      { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request payload exceeds 16 KB size limit' } },
      { status: 413 }
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON payload' } },
      { status: 400 }
    );
  }

  const validation = PlanRequestSchema.safeParse(parsedBody);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    const msg = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation failed';
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: msg } },
      { status: 400 }
    );
  }

  const { household, location, lang, manualAir } = validation.data;

  try {
    let air;
    let airSource: 'live' | 'cache' | 'manual';

    if (manualAir) {
      air = synthesizeManualAir(manualAir.pm25, manualAir.pm10, {
        aqi: manualAir.aqi,
        category: manualAir.category,
      });
      airSource = 'manual';
    } else {
      air = await fetchAirData(location.lat, location.lon);
      airSource = air.source;
    }

    const plan = assembleDayPlan(household, air);

    if (
      !plan.civic &&
      (location.admin?.toLowerCase().includes('delhi') ||
        (location.lat >= 28.1 && location.lat <= 28.95 && location.lon >= 76.7 && location.lon <= 77.55))
    ) {
      plan.civic = 'Delhi-NCR Winter Smog Advisory: Check official municipal notices for local air quality alerts.';
    }

    const { narration, mode } = await narratePlan(plan, household, lang);

    console.info(
      JSON.stringify({
        route: '/api/plan',
        ms: Date.now() - start,
        mode,
        airSource,
      })
    );

    return NextResponse.json(
      {
        plan,
        narration,
        meta: {
          mode,
          airSource,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'PLAN_GENERATION_FAILED', message: 'Failed to assemble clean-air plan' } },
      { status: 500 }
    );
  }
}
