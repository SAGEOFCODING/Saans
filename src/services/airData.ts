import { fetchWithRetry } from '../lib/http';
import { airCache, coordsToKey } from './cache';
import { calculateNAQI } from '../domain/aqi';
import { detectStagnation } from '../domain/window';
import type { Air, HourlyPoint } from '../domain/types';

interface OpenMeteoAQResponse {
  current?: { time?: string; pm10?: number; pm2_5?: number };
  hourly?: { time?: string[]; pm10?: (number | null)[]; pm2_5?: (number | null)[] };
}

interface OpenMeteoForecastResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    visibility?: number;
  };
}

export function synthesizeManualAir(pm25: number, pm10?: number, options?: Partial<Air>): Air {
  const p10 = pm10 ?? Math.round(pm25 * 1.5);
  const naqi = calculateNAQI(pm25, p10);
  const nowIso = new Date().toISOString();
  const hourly: HourlyPoint[] = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(Date.now() + i * 3600 * 1000);
    return { t: d.toISOString(), pm25, aqi: naqi.aqi };
  });

  return {
    at: nowIso,
    pm25,
    pm10: p10,
    aqi: options?.aqi ?? naqi.aqi,
    category: options?.category ?? naqi.category,
    dominant: naqi.dominant,
    visibilityKm: 3.5,
    windKmh: 5.0,
    tempC: 18.0,
    rh: 60.0,
    stagnant: false,
    hourly,
    source: 'manual',
    ageMin: 0,
    ...options,
  };
}

function parseHourlyPoints(aqData: OpenMeteoAQResponse): HourlyPoint[] {
  const times = aqData.hourly?.time || [];
  const pm25s = aqData.hourly?.pm2_5 || [];
  const pm10s = aqData.hourly?.pm10 || [];
  const count = Math.min(times.length, 24);
  const hourly: HourlyPoint[] = [];

  for (let i = 0; i < count; i++) {
    const p25 = Math.max(0, pm25s[i] ?? 0);
    const p10 = Math.max(0, pm10s[i] ?? 0);
    hourly.push({
      t: times[i],
      pm25: p25,
      aqi: calculateNAQI(p25, p10).aqi,
    });
  }
  return hourly;
}

export async function fetchAirData(lat: number, lon: number): Promise<Air> {
  const lat2 = Number(lat.toFixed(2));
  const lon2 = Number(lon.toFixed(2));
  const key = coordsToKey(lat2, lon2);

  const cached = airCache.get(key);
  if (cached) {
    const staleMeta = airCache.getStale(key);
    return { ...cached, source: 'cache', ageMin: staleMeta?.ageMin ?? 0 };
  }

  return airCache.coalesce(key, async () => {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat2}&longitude=${lon2}&current=pm10,pm2_5&hourly=pm10,pm2_5&forecast_days=2&timezone=auto`;
    const fcUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat2}&longitude=${lon2}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&timezone=auto`;

    const [aqRes, fcRes] = await Promise.allSettled([
      fetchWithRetry(aqUrl, { timeoutMs: 4000, retries: 1 }),
      fetchWithRetry(fcUrl, { timeoutMs: 4000, retries: 1 }),
    ]);

    if (aqRes.status === 'rejected' || !aqRes.value.ok) {
      const stale = airCache.getStale(key);
      if (stale) {
        return { ...stale.value, source: 'cache', ageMin: stale.ageMin };
      }
      throw new Error('Failed to retrieve upstream air quality data');
    }

    const aqData = (await aqRes.value.json()) as OpenMeteoAQResponse;
    let fcData: OpenMeteoForecastResponse = {};
    if (fcRes.status === 'fulfilled' && fcRes.value.ok) {
      try {
        fcData = (await fcRes.value.json()) as OpenMeteoForecastResponse;
      } catch {
        // Fallback gracefully on forecast parse failure
      }
    }

    const pm25 = Math.max(0, aqData.current?.pm2_5 ?? 50);
    const pm10 = Math.max(0, aqData.current?.pm10 ?? 80);
    const naqi = calculateNAQI(pm25, pm10);

    const windKmh = fcData.current?.wind_speed_10m ?? 5;
    const tempC = fcData.current?.temperature_2m ?? 20;
    const rh = fcData.current?.relative_humidity_2m ?? 50;
    const visMeters = fcData.current?.visibility;
    const visibilityKm = visMeters != null ? Math.round((visMeters / 1000) * 10) / 10 : undefined;
    const stagnant = detectStagnation({ windKmh, tempC, rh, at: aqData.current?.time });

    const hourly = parseHourlyPoints(aqData);

    const air: Air = {
      at: aqData.current?.time || new Date().toISOString(),
      pm25,
      pm10,
      aqi: naqi.aqi,
      category: naqi.category,
      dominant: naqi.dominant,
      visibilityKm,
      windKmh,
      tempC,
      rh,
      stagnant,
      hourly: hourly.length > 0 ? hourly : synthesizeManualAir(pm25, pm10).hourly,
      source: 'live',
      ageMin: 0,
    };

    airCache.set(key, air, 15 * 60 * 1000);
    return air;
  });
}
