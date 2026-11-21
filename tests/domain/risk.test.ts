import { describe, it, expect } from 'vitest';
import {
  assessMemberRisk,
  assessHouseholdRisk,
  getWorstMemberRisk,
  hasSensitiveMember,
} from '@/domain/risk';
import { Member } from '@/domain/types';

describe('Domain: Risk Assessment & Sensitivity Privacy (Feature 9)', () => {
  it('assigns base risk tiers for general adult members without bump', () => {
    const adult: Member = { band: 'adult' };
    expect(assessMemberRisk(adult, 'good').tier).toBe(0);
    expect(assessMemberRisk(adult, 'satisfactory').tier).toBe(1);
    expect(assessMemberRisk(adult, 'moderate').tier).toBe(2);
    expect(assessMemberRisk(adult, 'poor').tier).toBe(3);
    expect(assessMemberRisk(adult, 'very-poor').tier).toBe(4);
    expect(assessMemberRisk(adult, 'severe').tier).toBe(5);
  });

  it('applies +1 vulnerability bump to infant, senior, and sensitive members', () => {
    const infant: Member = { band: 'infant' };
    const senior: Member = { band: 'senior' };
    const sensitiveChild: Member = { band: 'child', sensitive: true };

    // In 'moderate' (base tier 2), vulnerable members should bump to Tier 3
    expect(assessMemberRisk(infant, 'moderate').tier).toBe(3);
    expect(assessMemberRisk(senior, 'moderate').tier).toBe(3);
    expect(assessMemberRisk(sensitiveChild, 'moderate').tier).toBe(3);

    // In 'very-poor' (base tier 4), bump to Tier 5
    expect(assessMemberRisk(infant, 'very-poor').tier).toBe(5);
    expect(assessMemberRisk(senior, 'very-poor').tier).toBe(5);
  });

  it('caps risk tier strictly at maximum Tier 5 during severe smog', () => {
    const sensitiveSenior: Member = { band: 'senior', sensitive: true };
    // Base tier 5 + bump 1 -> 6 -> clamped to 5
    const risk = assessMemberRisk(sensitiveSenior, 'severe');
    expect(risk.tier).toBe(5);
  });

  it('provides plain-language guidance messages for each tier', () => {
    const adult: Member = { band: 'adult' };
    const riskTier0 = assessMemberRisk(adult, 'good');
    const riskTier5 = assessMemberRisk(adult, 'severe');

    expect(typeof riskTier0.message).toBe('string');
    expect(riskTier0.message!.length).toBeGreaterThan(0);
    expect(typeof riskTier5.message).toBe('string');
    expect(riskTier5.message!.length).toBeGreaterThan(0);
  });

  it('evaluates worst member risk correctly in a diverse household', () => {
    const members: Member[] = [
      { band: 'adult' }, // tier 3 in poor
      { band: 'infant', sensitive: true }, // tier 4 in poor
      { band: 'child' }, // tier 3 in poor
    ];

    const householdRisks = assessHouseholdRisk(members, 'poor');
    expect(householdRisks).toHaveLength(3);

    const worst = getWorstMemberRisk(householdRisks);
    expect(worst.tier).toBe(4);
    expect(worst.band).toBe('infant');
  });

  it('correctly evaluates hasSensitiveMember privacy shield boolean', () => {
    expect(hasSensitiveMember([{ band: 'adult' }])).toBe(false);
    expect(hasSensitiveMember([{ band: 'adult' }, { band: 'infant' }])).toBe(true);
    expect(hasSensitiveMember([{ band: 'adult' }, { band: 'senior' }])).toBe(true);
    expect(hasSensitiveMember([{ band: 'adult', sensitive: true }])).toBe(true);
    expect(hasSensitiveMember([{ band: 'child', sensitive: false }])).toBe(false);
  });
});
