import React from 'react';
import type { AirCategory } from '@/domain/types';

interface CategoryIconProps {
  category?: AirCategory;
  tier?: number;
  className?: string;
  size?: number;
}

const CATEGORY_MAP: Record<AirCategory, { shape: string; label: string; char: string }> = {
  good: { shape: 'circle', label: 'Good', char: '●' },
  satisfactory: { shape: 'half-circle', label: 'Satisfactory', char: '◐' },
  moderate: { shape: 'triangle', label: 'Moderate', char: '▲' },
  poor: { shape: 'diamond', label: 'Poor', char: '◆' },
  'very-poor': { shape: 'square', label: 'Very Poor', char: '■' },
  severe: { shape: 'hexagon', label: 'Severe', char: '⬢' },
};

const TIER_ORDER: AirCategory[] = ['good', 'satisfactory', 'moderate', 'poor', 'very-poor', 'severe'];

export function CategoryIcon({ category, tier, className = '', size = 16 }: CategoryIconProps) {
  const cat = category ?? (tier !== undefined && tier >= 0 && tier <= 5 ? TIER_ORDER[tier] : 'moderate');
  const meta = CATEGORY_MAP[cat] ?? CATEGORY_MAP.moderate;

  return (
    <span
      className={`inline-flex items-center justify-center font-bold select-none ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      aria-label={`${meta.label} air quality indicator shape (${meta.shape})`}
      role="img"
    >
      {meta.char}
    </span>
  );
}
