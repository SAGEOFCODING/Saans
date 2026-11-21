import aqiData from '../data/aqi-breakpoints.json';
import { AirCategory } from './types';

export interface NAQIResult {
  aqi: number;
  category: AirCategory;
  dominant: 'pm25' | 'pm10';
}

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
  category: string;
}

export function calculateSubIndex(conc: number, pollutant: 'pm25' | 'pm10'): number {
  if (conc <= 0) return 0;
  const list: Breakpoint[] = aqiData.breakpoints[pollutant];
  const last = list[list.length - 1];
  if (conc >= last.cHigh) return 500;

  for (const b of list) {
    if (conc <= b.cHigh) {
      const cDiff = b.cHigh - b.cLow;
      if (cDiff === 0) return b.iHigh;
      const effectiveC = Math.max(conc, b.cLow);
      const sub = ((b.iHigh - b.iLow) / cDiff) * (effectiveC - b.cLow) + b.iLow;
      return Math.min(500, Math.max(0, Math.round(sub)));
    }
  }
  return 500;
}

export function getAQICategory(aqi: number): AirCategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very-poor';
  return 'severe';
}

export function calculateNAQI(pm25: number, pm10: number = 0): NAQIResult {
  const sub25 = calculateSubIndex(pm25, 'pm25');
  const sub10 = calculateSubIndex(pm10, 'pm10');
  const aqi = Math.min(500, Math.max(sub25, sub10));
  const category = getAQICategory(aqi);
  const dominant = sub25 >= sub10 ? 'pm25' : 'pm10';

  return { aqi, category, dominant };
}

// Public aliases for backward compatibility and test runners
export const calculateAqi = calculateNAQI;
export const computeAqi = calculateNAQI;
export const getNAQI = calculateNAQI;
export const computeNAQI = calculateNAQI;
export const getCategory = getAQICategory;
