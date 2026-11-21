import { describe, it, expect } from 'vitest';
import { getSeason, getGRAPStage, isLocationInDelhiNCR } from '@/domain/context';

describe('Domain: Context, Seasonality & GRAP Hints (Feature 15)', () => {
  it('detects North Indian smog seasons accurately via pure date injection', () => {
    // Nov 15: Post-Monsoon & Stubble Burning Smog
    const stubbleDate = new Date('2026-11-15T08:00:00Z');
    const stubbleRes = getSeason(stubbleDate);
    expect(stubbleRes.season).toContain('Stubble Burning');

    // Jan 10: Peak Winter Inversion & Dense Fog
    const peakWinterDate = new Date('2027-01-10T08:00:00Z');
    const peakWinterRes = getSeason(peakWinterDate);
    expect(peakWinterRes.season).toContain('Winter Inversion');

    // Feb 15: Late Winter Transition
    const lateWinterDate = new Date('2027-02-15T08:00:00Z');
    const lateWinterRes = getSeason(lateWinterDate);
    expect(lateWinterRes.season).toContain('Late Winter');

    // Jul 20: Summer Dust & Monsoon Cleansing
    const monsoonDate = new Date('2027-07-20T08:00:00Z');
    const monsoonRes = getSeason(monsoonDate);
    expect(monsoonRes.season).toContain('Monsoon');
  });

  it('determines Delhi-NCR bounding coordinates and cities', () => {
    expect(isLocationInDelhiNCR({ lat: 28.61, lon: 77.23 })).toBe(true); // New Delhi
    expect(isLocationInDelhiNCR({ lat: 28.45, lon: 77.02 })).toBe(true); // Gurugram
    expect(isLocationInDelhiNCR({ lat: 19.07, lon: 72.87, name: 'Mumbai' })).toBe(false); // Mumbai
  });

  it('resolves Delhi-NCR GRAP stages based on AQI', () => {
    const delhiLoc = { lat: 28.61, lon: 77.23 };

    // Stage 1: 201 - 300
    const stage1 = getGRAPStage(250, delhiLoc);
    expect(stage1?.stage).toBe(1);
    expect(stage1?.name).toContain('Stage I');

    // Stage 2: 301 - 400
    const stage2 = getGRAPStage(350, delhiLoc);
    expect(stage2?.stage).toBe(2);
    expect(stage2?.name).toContain('Stage II');

    // Stage 3: 401 - 450
    const stage3 = getGRAPStage(420, delhiLoc);
    expect(stage3?.stage).toBe(3);
    expect(stage3?.name).toContain('Stage III');

    // Stage 4: > 450
    const stage4 = getGRAPStage(480, delhiLoc);
    expect(stage4?.stage).toBe(4);
    expect(stage4?.name).toContain('Stage IV');

    // No GRAP below 201 or outside NCR
    expect(getGRAPStage(150, delhiLoc)).toBeNull();
    expect(getGRAPStage(350, { lat: 19.07, lon: 72.87, name: 'Mumbai' })).toBeNull();
  });
});
