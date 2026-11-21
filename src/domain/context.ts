import { Location } from './types';
import regionsData from '../data/regions.json';

export interface SeasonInfo {
  season: string;
  hint: string;
}

export interface GRAPStageInfo {
  stage: number;
  name: string;
  hint: string;
}

export function getSeason(date: Date = new Date('2026-11-21T06:00:00Z')): SeasonInfo {
  const month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate();

  for (const s of regionsData.seasons) {
    if (s.startMonth <= s.endMonth) {
      const afterStart = month > s.startMonth || (month === s.startMonth && day >= s.startDay);
      const beforeEnd = month < s.endMonth || (month === s.endMonth && day <= s.endDay);
      if (afterStart && beforeEnd) return { season: s.name, hint: s.hint };
    } else {
      // Wraps around new year (e.g. Dec to Jan)
      const inFirstPart = month > s.startMonth || (month === s.startMonth && day >= s.startDay);
      const inSecondPart = month < s.endMonth || (month === s.endMonth && day <= s.endDay);
      if (inFirstPart || inSecondPart) return { season: s.name, hint: s.hint };
    }
  }

  return {
    season: 'Winter Smog Season',
    hint: 'Stagnant boundary layer conditions trap particulates near surface level.',
  };
}

export function isLocationInDelhiNCR(loc?: Location): boolean {
  if (!loc) return true; // Default to Delhi NCR
  const { delhiNcr } = regionsData;
  if (loc.lat >= delhiNcr.latMin && loc.lat <= delhiNcr.latMax && loc.lon >= delhiNcr.lonMin && loc.lon <= delhiNcr.lonMax) {
    return true;
  }
  const name = `${loc.name || ''} ${loc.admin || ''}`.toLowerCase();
  return delhiNcr.cities.some((c) => name.includes(c.toLowerCase()));
}

export function getGRAPStage(aqi: number, loc?: Location): GRAPStageInfo | null {
  if (!isLocationInDelhiNCR(loc) || aqi <= 200) {
    return null;
  }

  for (const s of regionsData.grapStages) {
    if (aqi >= s.aqiMin && aqi <= s.aqiMax) {
      return { stage: s.stage, name: s.name, hint: `${s.summary} ${s.hint}` };
    }
  }
  const stage4 = regionsData.grapStages[regionsData.grapStages.length - 1];
  return { stage: stage4.stage, name: stage4.name, hint: `${stage4.summary} ${stage4.hint}` };
}
