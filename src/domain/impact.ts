import factors from '../data/impact-factors.json';

export function calculateCommunityCO2e(
  households: number,
  adoptionRate: number,
  perHouseholdCO2eKgDay: number,
  days: number
): number {
  return households * adoptionRate * perHouseholdCO2eKgDay * days;
}

export function scaleCommunityImpact(
  households: number,
  adoptionRate: number,
  perHouseholdCO2eKgDay: number,
  days: number
): {
  collectiveCO2eKg: number;
  petrolCarTripsSaved: number;
} {
  const collectiveCO2eKg = calculateCommunityCO2e(
    households,
    adoptionRate,
    perHouseholdCO2eKgDay,
    days
  );
  // 10-km petrol-car trip emits approx 1.7 kg CO2e (0.17 kg/km * 10 km)
  const petrolCarTripsSaved = Math.round(collectiveCO2eKg / 1.7);
  return { collectiveCO2eKg, petrolCarTripsSaved };
}

export function calculateTransitCO2eSavings(
  oldMode: string,
  newMode: string,
  distance: 'short' | 'mid' | 'long'
): number {
  const distKm = distance === 'short' ? 5 : distance === 'mid' ? 15 : 30;
  const emissions = factors.emissionsKgCO2ePerKm as Record<string, number>;
  const oldRate = emissions[oldMode] ?? 0;
  const newRate = emissions[newMode] ?? 0;

  const deltaPerKm = Math.max(0, oldRate - newRate);
  return Math.round(distKm * deltaPerKm * 100) / 100;
}

export function estimateImpact(
  baselineIndex: number,
  plannedIndex: number
): { marginalReductionPct: number } {
  if (baselineIndex <= 0) return { marginalReductionPct: 0 };
  const reduction = Math.max(0, baselineIndex - plannedIndex);
  const marginalReductionPct = Math.round((reduction / baselineIndex) * 100);
  return { marginalReductionPct };
}
