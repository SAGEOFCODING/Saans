import { HourlyPoint, WindowResult } from './types';
import regionsData from '../data/regions.json';

function isNightOrEarlyHour(at?: string | Date): boolean {
  if (!at) return true;
  if (typeof at === 'string') {
    const match = at.match(/T(\d{2}):/);
    if (match) {
      const h = parseInt(match[1], 10);
      return regionsData.stagnation.nightEarlyHours.includes(h);
    }
  }
  const d = typeof at === 'string' ? new Date(at) : at;
  const h = d.getHours();
  return regionsData.stagnation.nightEarlyHours.includes(h);
}

export function detectStagnation(weather: {
  windKmh: number;
  tempC: number;
  rh: number;
  at?: string | Date;
}): boolean {
  const { stagnation } = regionsData;
  const isNight = isNightOrEarlyHour(weather.at);
  const coldOrNight = weather.tempC < stagnation.tempCMax || isNight;

  return (
    weather.windKmh < stagnation.windKmhMax &&
    coldOrNight &&
    weather.rh > stagnation.rhMinPct
  );
}

interface WindowScanResult {
  bestIdx: number;
  worstIdx: number;
  minMean: number;
}

function scanWindows(hourly: HourlyPoint[], duration: number): WindowScanResult {
  let minMean = Infinity;
  let maxMean = -Infinity;
  let bestIdx = 0;
  let worstIdx = 0;
  const limit = hourly.length - duration + 1;

  for (let i = 0; i < limit; i++) {
    let sum = 0;
    for (let j = 0; j < duration; j++) {
      sum += hourly[i + j].pm25;
    }
    const mean = sum / duration;
    if (mean < minMean) {
      minMean = mean;
      bestIdx = i;
    }
    if (mean > maxMean) {
      maxMean = mean;
      worstIdx = i;
    }
  }

  return { bestIdx, worstIdx, minMean };
}

function makeSpan(hourly: HourlyPoint[], startIdx: number, duration: number): { start: string; end: string } {
  return {
    start: hourly[startIdx].t,
    end: hourly[startIdx + duration - 1]?.t || hourly[startIdx].t,
  };
}

export function findBestWindow(
  hourly: HourlyPoint[],
  durationHours: number = 1
): WindowResult {
  if (!hourly || hourly.length === 0) {
    const emptySpan = { start: '', end: '' };
    return { best: emptySpan, worst: emptySpan, pm25AtBest: 0, pm25NowAvg: 0 };
  }

  const safeDuration = Math.max(1, Math.min(durationHours, hourly.length));
  const { bestIdx, worstIdx, minMean } = scanWindows(hourly, safeDuration);

  return {
    best: makeSpan(hourly, bestIdx, safeDuration),
    worst: makeSpan(hourly, worstIdx, safeDuration),
    pm25AtBest: Math.round(minMean),
    pm25NowAvg: Math.round(hourly[0].pm25),
  };
}

export function getBestWindowForActivity(
  hourly: HourlyPoint[],
  activity: 'walk' | 'play' | 'exercise' | 'ventilate'
): WindowResult {
  const duration = activity === 'ventilate' ? 1 : 1;
  return findBestWindow(hourly, duration);
}
