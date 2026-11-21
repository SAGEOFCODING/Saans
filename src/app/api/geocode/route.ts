import { NextRequest, NextResponse } from 'next/server';
import { searchLocality } from '@/services/geocode';
import { checkRateLimit, getClientIp } from '@/services/rateLimit';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, 'geocode', 60, 60000);

  if (!rate.allowed) {
    const seconds = Math.max(1, Math.ceil(rate.resetMs / 1000));
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded for geocoding' } },
      { status: 429, headers: { 'Retry-After': String(seconds) } }
    );
  }

  const q = request.nextUrl.searchParams.get('q');
  if (q === null || q.trim().length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_QUERY', message: 'Query parameter q is required' } },
      { status: 400 }
    );
  }

  if (q.length > 80) {
    return NextResponse.json(
      { error: { code: 'QUERY_TOO_LONG', message: 'Query must not exceed 80 characters' } },
      { status: 400 }
    );
  }

  try {
    const results = await searchLocality(q);
    return NextResponse.json(results, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: 'GEOCODE_ERROR', message: 'Failed to retrieve locality results' } },
      { status: 500 }
    );
  }
}
