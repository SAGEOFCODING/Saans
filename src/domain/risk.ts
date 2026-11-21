import { AirCategory, Member, MemberRisk } from './types';
import stringsEn from '../data/strings.en.json';

const categoryToBaseTier: Record<AirCategory, number> = {
  good: 0,
  satisfactory: 1,
  moderate: 2,
  poor: 3,
  'very-poor': 4,
  severe: 5,
};

function getBaseTier(aqiOrCategory: number | AirCategory): number {
  if (typeof aqiOrCategory === 'string') {
    return categoryToBaseTier[aqiOrCategory] ?? 0;
  }
  if (aqiOrCategory <= 50) return 0;
  if (aqiOrCategory <= 100) return 1;
  if (aqiOrCategory <= 200) return 2;
  if (aqiOrCategory <= 300) return 3;
  if (aqiOrCategory <= 400) return 4;
  return 5;
}

export function assessMemberRisk(
  member: Member,
  aqiOrCategory: number | AirCategory
): MemberRisk {
  const base = getBaseTier(aqiOrCategory);
  const isVulnerable =
    member.band === 'infant' ||
    member.band === 'senior' ||
    member.sensitive === true;
  const bump = isVulnerable ? 1 : 0;
  const tier = Math.min(5, base + bump);

  const tierKey = String(tier) as keyof typeof stringsEn.riskTiers;
  const message = stringsEn.riskTiers[tierKey] || stringsEn.riskTiers['0'];

  return {
    band: member.band,
    tier,
    message,
    sensitive: member.sensitive,
  };
}

export function assessHouseholdRisk(
  members: Member[],
  aqiOrCategory: number | AirCategory
): MemberRisk[] {
  return members.map((m) => assessMemberRisk(m, aqiOrCategory));
}

export function getWorstMemberRisk(risks: MemberRisk[]): MemberRisk {
  if (risks.length === 0) {
    return { tier: 0, message: stringsEn.riskTiers['0'] };
  }
  return risks.reduce((worst, cur) => (cur.tier > worst.tier ? cur : worst), risks[0]);
}

export function hasSensitiveMember(members: Member[]): boolean {
  return members.some(
    (m) => m.sensitive === true || m.band === 'infant' || m.band === 'senior'
  );
}
