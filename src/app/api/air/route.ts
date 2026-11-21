import { NextRequest, NextResponse } from 'next/server';
import { fetchAirData } from '@/services/airData';
import { checkRateLimit, getClientIp } from '@/services/rateLimit';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, 'air', 60, 60000);

  if (!rate.allowed) {
    const seconds = Math.max(1, Math.ceil(rate.resetMs / 1000));
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded for air quality' } },
      { status: 429, headers: { 'Retry-After': String(seconds) } }
    );
  }

  const latParam = request.nextUrl.searchParams.get('lat');
  const lonParam = request.nextUrl.searchParams.get('lon');

  if (latParam === null || lonParam === null) {
    return NextResponse.json(
      { error: { code: 'INVALID_COORDINATES', message: 'lat and lon query parameters are required' } },
      { status: 400 }
    );
  }

  const lat = Number(latParam);
  const lon = Number(lonParam);

  if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        },
      },
      { status: 400 }
    );
  }

  try {
    const air = await fetchAirData(lat, lon);
    return NextResponse.json(air, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: 'AIR_DATA_ERROR', message: 'Failed to retrieve air quality snapshot' } },
      { status: 502 }
    );
  }
}
