import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isRouteImplemented } from '../harness/client';

const isAqiModulePresent = fs.existsSync(path.resolve(process.cwd(), 'src/domain/aqi.ts'));
const isAirRoutePresent = isRouteImplemented('/api/air');
const isTestable = isAqiModulePresent || isAirRoutePresent;

interface AqiResult {
  aqi: number;
  category: string;
  dominant?: string;
}

/**
 * Invokes the domain aqi calculation function with PM2.5 and optional PM10.
 */
async function computeDomainAqi(pm25: number, pm10: number = 0): Promise<AqiResult> {
  // @ts-ignore
  const mod = await import(/* @vite-ignore */ '@/domain/aqi' as string)
    // @ts-ignore
    .catch(() => import(/* @vite-ignore */ '../../../src/domain/aqi' as string));

  if (!mod) {
    throw new Error('Unable to load src/domain/aqi');
  }

  const fn = mod.calculateAqi || mod.computeAqi || mod.getNAQI || mod.computeNAQI || mod.default;
  if (typeof fn === 'function') {
    const res = fn(pm25, pm10);
    if (typeof res === 'number') {
      const catFn = mod.getCategory || mod.getAQICategory;
      const category = typeof catFn === 'function' ? catFn(res) : getStandardCategory(res);
      return { aqi: res, category };
    }
    return res;
  }

  if (typeof mod.calculateSubIndex === 'function') {
    const sub25 = mod.calculateSubIndex(pm25, 'pm25');
    const sub10 = mod.calculateSubIndex(pm10, 'pm10');
    const aqi = Math.max(sub25, sub10);
    const catFn = mod.getCategory || mod.getAQICategory;
    const category = typeof catFn === 'function' ? catFn(aqi) : getStandardCategory(aqi);
    return { aqi, category, dominant: sub25 >= sub10 ? 'pm25' : 'pm10' };
  }

  throw new Error('No recognized AQI function in src/domain/aqi');
}

function getStandardCategory(aqi: number): string {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very-poor';
  return 'severe';
}

describe.skipIf(!isTestable)('Tier 2 Boundary — CPCB NAQI Breakpoint Calculations', () => {
  it('TC-AQI-01: transitions at breakpoint 30 vs 31 (PM2.5: 30 is Good, 31 is Satisfactory)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Good: 0-50 for PM2.5 0-30; Satisfactory: 51-100 for PM2.5 31-60)
    const result30 = await computeDomainAqi(30, 0);
    expect(result30.aqi).toBe(50);
    expect(result30.category.toLowerCase()).toBe('good');

    const result31 = await computeDomainAqi(31, 0);
    expect(result31.aqi).toBe(51);
    expect(result31.category.toLowerCase()).toBe('satisfactory');
  });

  it('TC-AQI-02: transitions at breakpoint 60 vs 61 (PM2.5: 60 is Satisfactory, 61 is Moderate)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Satisfactory: 51-100 for PM2.5 31-60; Moderate: 101-200 for PM2.5 61-90)
    const result60 = await computeDomainAqi(60, 0);
    expect(result60.aqi).toBe(100);
    expect(result60.category.toLowerCase()).toBe('satisfactory');

    const result61 = await computeDomainAqi(61, 0);
    expect(result61.aqi).toBe(101);
    expect(result61.category.toLowerCase()).toBe('moderate');
  });

  it('TC-AQI-03: transitions at breakpoint 90 vs 91 (PM2.5: 90 is Moderate, 91 is Poor)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Moderate: 101-200 for PM2.5 61-90; Poor: 201-300 for PM2.5 91-120)
    const result90 = await computeDomainAqi(90, 0);
    expect(result90.aqi).toBe(200);
    expect(result90.category.toLowerCase()).toBe('moderate');

    const result91 = await computeDomainAqi(91, 0);
    expect(result91.aqi).toBe(201);
    expect(result91.category.toLowerCase()).toBe('poor');
  });

  it('TC-AQI-04: transitions at breakpoint 120 vs 121 (PM2.5: 120 is Poor, 121 is Very Poor)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Poor: 201-300 for PM2.5 91-120; Very Poor: 301-400 for PM2.5 121-250)
    const result120 = await computeDomainAqi(120, 0);
    expect(result120.aqi).toBe(300);
    expect(result120.category.toLowerCase()).toBe('poor');

    const result121 = await computeDomainAqi(121, 0);
    expect(result121.aqi).toBe(301);
    expect(result121.category.toLowerCase().replace(/[\s_]/g, '-')).toBe('very-poor');
  });

  it('TC-AQI-05: transitions at breakpoint 250 vs 251 (PM2.5: 250 is Very Poor, 251 is Severe)', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Very Poor: 301-400 for PM2.5 121-250; Severe: 401-500 for PM2.5 250+)
    const result250 = await computeDomainAqi(250, 0);
    expect(result250.aqi).toBe(400);
    expect(result250.category.toLowerCase().replace(/[\s_]/g, '-')).toBe('very-poor');

    const result251 = await computeDomainAqi(251, 0);
    expect(result251.aqi).toBeGreaterThanOrEqual(401);
    expect(result251.category.toLowerCase()).toBe('severe');
  });

  it('TC-AQI-06: clamps at maximum AQI 500 for extreme concentrations', async () => {
    // Authoritative source: docs/architecture.md §7.1 (Severe: 401-500, clamp at 500), §5 (aqi: number min 0 max 500)
    // PM2.5 at 500, 800, 1000 µg/m³
    const result500 = await computeDomainAqi(500, 0);
    expect(result500.aqi).toBe(500);
    expect(result500.category.toLowerCase()).toBe('severe');

    const result800 = await computeDomainAqi(800, 0);
    expect(result800.aqi).toBe(500);
    expect(result800.category.toLowerCase()).toBe('severe');

    const result1000 = await computeDomainAqi(1000, 0);
    expect(result1000.aqi).toBe(500);
    expect(result1000.category.toLowerCase()).toBe('severe');
  });
});
