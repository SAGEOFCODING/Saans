import { describe, it, expect } from 'vitest';
import {
  calculateCommunityCO2e,
  scaleCommunityImpact,
  calculateTransitCO2eSavings,
  estimateImpact,
} from '@/domain/impact';

describe('Domain: Impact Estimation & Community Math (Feature 14)', () => {
  it('scales community CO2e linearly: households * adoption * co2eKgDay * days', () => {
    const households = 120;
    const adoptionRate = 0.5;
    const co2eKgDay = 1.75;
    const days = 30;

    const baseCollective = calculateCommunityCO2e(households, adoptionRate, co2eKgDay, days);
    expect(baseCollective).toBe(120 * 0.5 * 1.75 * 30); // 3150 kg CO2e

    // Doubling households doubles impact
    expect(calculateCommunityCO2e(households * 2, adoptionRate, co2eKgDay, days)).toBe(baseCollective * 2);

    // Doubling days doubles impact
    expect(calculateCommunityCO2e(households, adoptionRate, co2eKgDay, days * 2)).toBe(baseCollective * 2);

    // Boundary conditions
    expect(calculateCommunityCO2e(0, adoptionRate, co2eKgDay, days)).toBe(0);
    expect(calculateCommunityCO2e(households, 0, co2eKgDay, days)).toBe(0);
    expect(calculateCommunityCO2e(households, adoptionRate, 0, days)).toBe(0);
    expect(calculateCommunityCO2e(households, adoptionRate, co2eKgDay, 0)).toBe(0);
  });

  it('calculates equivalents like 10-km petrol car trips saved in scaleCommunityImpact', () => {
    const res = scaleCommunityImpact(100, 1.0, 1.7, 10);
    // 100 * 1.0 * 1.7 * 10 = 1700 kg CO2e
    // Trips = 1700 / 1.7 = 1000 trips
    expect(res.collectiveCO2eKg).toBe(1700);
    expect(res.petrolCarTripsSaved).toBe(1000);
  });

  it('computes transit CO2e savings for mode changes', () => {
    // Petrol car (0.17 kg/km) to bus (0.03 kg/km) over 15 km
    // Delta = (0.17 - 0.03) * 15 = 0.14 * 15 = 2.1 kg
    const carToBus = calculateTransitCO2eSavings('petrol-car', 'bus-pax', 'mid');
    expect(carToBus).toBe(2.1);

    // Two-wheeler (0.04 kg/km) to metro (0.03 kg/km) over 15 km
    // Delta = (0.04 - 0.03) * 15 = 0.15 kg
    const bikeToMetro = calculateTransitCO2eSavings('two-wheeler', 'metro-pax', 'mid');
    expect(bikeToMetro).toBe(0.15);
  });

  it('computes marginal reduction percentage accurately', () => {
    expect(estimateImpact(200, 140)).toEqual({ marginalReductionPct: 30 });
    expect(estimateImpact(0, 0)).toEqual({ marginalReductionPct: 0 });
  });
});
