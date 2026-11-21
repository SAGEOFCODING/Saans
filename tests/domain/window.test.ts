import { describe, it, expect } from 'vitest';
import {
  findBestWindow,
  detectStagnation,
  getBestWindowForActivity,
} from '@/domain/window';
import { HourlyPoint } from '@/domain/types';

describe('Domain: Sliding Window & Stagnation Detection (Feature 10)', () => {
  const sampleForecast: HourlyPoint[] = [
    { t: '2026-11-21T06:00:00Z', pm25: 350, aqi: 410 },
    { t: '2026-11-21T07:00:00Z', pm25: 320, aqi: 390 },
    { t: '2026-11-21T08:00:00Z', pm25: 280, aqi: 350 },
    { t: '2026-11-21T12:00:00Z', pm25: 110, aqi: 240 }, // lowest dip
    { t: '2026-11-21T13:00:00Z', pm25: 120, aqi: 250 },
    { t: '2026-11-21T14:00:00Z', pm25: 130, aqi: 260 },
    { t: '2026-11-21T20:00:00Z', pm25: 420, aqi: 450 }, // highest spike
    { t: '2026-11-21T21:00:00Z', pm25: 400, aqi: 440 },
  ];

  it('slides 1h window to identify lowest and highest PM2.5 periods', () => {
    const res = findBestWindow(sampleForecast, 1);
    expect(res.best.start).toBe('2026-11-21T12:00:00Z');
    expect(res.pm25AtBest).toBe(110);
    expect(res.worst.start).toBe('2026-11-21T20:00:00Z');
    expect(res.pm25NowAvg).toBe(350);
  });

  it('handles multi-hour window spans (e.g. 2h duration)', () => {
    const res = findBestWindow(sampleForecast, 2);
    // 12:00 and 13:00 give mean (110+120)/2 = 115
    expect(res.best.start).toBe('2026-11-21T12:00:00Z');
    expect(res.best.end).toBe('2026-11-21T13:00:00Z');
    expect(res.pm25AtBest).toBe(115);
  });

  it('handles empty or small forecast arrays gracefully', () => {
    const emptyRes = findBestWindow([], 1);
    expect(emptyRes.pm25AtBest).toBe(0);

    const singlePoint: HourlyPoint[] = [{ t: '2026-11-21T06:00:00Z', pm25: 150, aqi: 200 }];
    const singleRes = findBestWindow(singlePoint, 1);
    expect(singleRes.pm25AtBest).toBe(150);
    expect(singleRes.best.start).toBe('2026-11-21T06:00:00Z');
  });

  it('delegates activity windows appropriately in getBestWindowForActivity', () => {
    const walkWindow = getBestWindowForActivity(sampleForecast, 'walk');
    expect(walkWindow.best.start).toBe('2026-11-21T12:00:00Z');
  });

  it('flags stagnation when wind < 6 km/h, cold/night, and rh > 60%', () => {
    // Severe calm winter night
    expect(
      detectStagnation({
        windKmh: 4.0,
        tempC: 10,
        rh: 75,
        at: '2026-11-21T22:00:00Z',
      })
    ).toBe(true);

    // Negative case: windy
    expect(
      detectStagnation({
        windKmh: 12.0,
        tempC: 10,
        rh: 75,
        at: '2026-11-21T22:00:00Z',
      })
    ).toBe(false);

    // Negative case: dry air (rh < 60)
    expect(
      detectStagnation({
        windKmh: 4.0,
        tempC: 10,
        rh: 50,
        at: '2026-11-21T22:00:00Z',
      })
    ).toBe(false);

    // Negative case: warm afternoon (temp > 12 and not night/early morning)
    expect(
      detectStagnation({
        windKmh: 4.0,
        tempC: 22,
        rh: 70,
        at: '2026-11-21T14:00:00Z',
      })
    ).toBe(false);
  });
});
