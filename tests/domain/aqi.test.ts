import { describe, it, expect } from 'vitest';
import {
  calculateNAQI,
  calculateSubIndex,
  getAQICategory,
} from '@/domain/aqi';

describe('Domain: NAQI & Breakpoints (Feature 7)', () => {
  it('calculates exact CPCB NAQI breakpoint transitions for PM2.5', () => {
    // Breakpoint 30 vs 31
    expect(calculateNAQI(30, 0)).toMatchObject({ aqi: 50, category: 'good' });
    expect(calculateNAQI(31, 0)).toMatchObject({ aqi: 51, category: 'satisfactory' });

    // Breakpoint 60 vs 61
    expect(calculateNAQI(60, 0)).toMatchObject({ aqi: 100, category: 'satisfactory' });
    expect(calculateNAQI(61, 0)).toMatchObject({ aqi: 101, category: 'moderate' });

    // Breakpoint 90 vs 91
    expect(calculateNAQI(90, 0)).toMatchObject({ aqi: 200, category: 'moderate' });
    expect(calculateNAQI(91, 0)).toMatchObject({ aqi: 201, category: 'poor' });

    // Breakpoint 120 vs 121
    expect(calculateNAQI(120, 0)).toMatchObject({ aqi: 300, category: 'poor' });
    expect(calculateNAQI(121, 0)).toMatchObject({ aqi: 301, category: 'very-poor' });

    // Breakpoint 250 vs 251
    expect(calculateNAQI(250, 0)).toMatchObject({ aqi: 400, category: 'very-poor' });
    expect(calculateNAQI(251, 0).aqi).toBeGreaterThanOrEqual(401);
    expect(calculateNAQI(251, 0).category).toBe('severe');
  });

  it('clamps extreme particulate concentrations strictly at 500', () => {
    expect(calculateNAQI(380, 0).aqi).toBe(500);
    expect(calculateNAQI(500, 0)).toMatchObject({ aqi: 500, category: 'severe' });
    expect(calculateNAQI(800, 0)).toMatchObject({ aqi: 500, category: 'severe' });
    expect(calculateNAQI(1000, 0)).toMatchObject({ aqi: 500, category: 'severe' });
  });

  it('handles negative concentrations safely by clamping to 0', () => {
    expect(calculateNAQI(-10, -5)).toMatchObject({ aqi: 0, category: 'good' });
    expect(calculateSubIndex(-5, 'pm25')).toBe(0);
    expect(calculateSubIndex(-5, 'pm10')).toBe(0);
  });

  it('evaluates PM10 sub-indices and dominant pollutant selection', () => {
    // PM10 dominant
    const resPm10 = calculateNAQI(15, 150); // PM2.5 = 15 (good, aqi 25), PM10 = 150 (moderate, aqi ~133)
    expect(resPm10.dominant).toBe('pm10');
    expect(resPm10.aqi).toBe(calculateSubIndex(150, 'pm10'));

    // PM2.5 dominant
    const resPm25 = calculateNAQI(150, 80);
    expect(resPm25.dominant).toBe('pm25');

    // Tie-breaker selects pm25
    const resTie = calculateNAQI(30, 50); // both yield 50
    expect(resTie.dominant).toBe('pm25');
  });

  it('maps all categories correctly in getAQICategory', () => {
    expect(getAQICategory(25)).toBe('good');
    expect(getAQICategory(50)).toBe('good');
    expect(getAQICategory(75)).toBe('satisfactory');
    expect(getAQICategory(100)).toBe('satisfactory');
    expect(getAQICategory(150)).toBe('moderate');
    expect(getAQICategory(200)).toBe('moderate');
    expect(getAQICategory(250)).toBe('poor');
    expect(getAQICategory(300)).toBe('poor');
    expect(getAQICategory(350)).toBe('very-poor');
    expect(getAQICategory(400)).toBe('very-poor');
    expect(getAQICategory(450)).toBe('severe');
    expect(getAQICategory(500)).toBe('severe');
  });
});
