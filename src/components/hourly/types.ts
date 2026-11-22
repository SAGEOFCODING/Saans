import type { HourlyPoint, Span } from '@/domain/types';

export interface HourlyViewProps {
  hourly: HourlyPoint[];
  bestWindow?: Span;
  worstWindow?: Span;
  lang: 'en' | 'hi';
  currentAqi?: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  good: '#1B7F3B',
  satisfactory: '#4F7A12',
  moderate: '#F2C230',
  poor: '#E8730C',
  'very-poor': '#C62828',
  severe: '#7B1E3A',
};

export const CATEGORY_NAMES_EN: Record<string, string> = {
  good: 'Good',
  satisfactory: 'Satisfactory',
  moderate: 'Moderate',
  poor: 'Poor',
  'very-poor': 'Very Poor',
  severe: 'Severe',
};

export const CATEGORY_NAMES_HI: Record<string, string> = {
  good: 'अच्छा (Good)',
  satisfactory: 'संतोषजनक (Satisfactory)',
  moderate: 'मध्यम (Moderate)',
  poor: 'खराब (Poor)',
  'very-poor': 'बहुत खराब (Very Poor)',
  severe: 'गंभीर (Severe)',
};
