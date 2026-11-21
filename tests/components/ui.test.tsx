import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Air, ChosenAction } from '@/domain/types';
import { HazeHero } from '@/components/HazeHero';
import { StatusStrip } from '@/components/StatusStrip';
import { HourlyStrip } from '@/components/HourlyStrip';
import { ActionItem } from '@/components/ActionItem';
import { ImpactBar } from '@/components/ImpactBar';
import { CommunityPack } from '@/components/CommunityPack';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SafetyNote } from '@/components/SafetyNote';

const MOCK_AIR: Air = {
  at: '2026-11-21T12:00:00Z',
  pm25: 280,
  pm10: 420,
  aqi: 380,
  category: 'severe',
  dominant: 'pm25',
  visibilityKm: 1.2,
  windKmh: 4.5,
  tempC: 19.5,
  rh: 68,
  stagnant: true,
  source: 'live',
  ageMin: 5,
  hourly: Array.from({ length: 24 }).map((_, i) => ({
    t: `${String(i).padStart(2, '0')}:00`,
    pm25: 150 + Math.sin(i / 3) * 80,
    aqi: 200 + Math.sin(i / 3) * 100,
  })),
};

describe('Milestone 5 UI Presentation Components', () => {
  it('renders HazeHero with AQI, NAQI category badge, and visibility sentence', () => {
    const html = renderToStaticMarkup(<HazeHero air={MOCK_AIR} />);
    expect(html).toContain('380');
    expect(html).toContain('Severe Smog');
    expect(html).toContain('You can see about 1.2 km.');
    expect(html).toContain('PM2.5: 280 µg/m³');
  });

  it('renders StatusStrip with responsive metric pills and stagnant badge', () => {
    const html = renderToStaticMarkup(<StatusStrip air={MOCK_AIR} />);
    expect(html).toContain('PM2.5:');
    expect(html).toContain('280 µg/m³');
    expect(html).toContain('PM10:');
    expect(html).toContain('420 µg/m³');
    expect(html).toContain('Stagnant Air (Trapping Smog)');
  });

  it('renders HourlyStrip with 24h SVG bars, patterns and cleanest window', () => {
    const bestWindow = { start: '13:00', end: '16:00' };
    const html = renderToStaticMarkup(
      <HourlyStrip hourly={MOCK_AIR.hourly} bestWindow={bestWindow} />
    );
    expect(html).toContain('24-Hour Forecast &amp; Cleanest Window');
    expect(html).toContain('13:00–16:00');
    expect(html).toContain('pat-sev');
  });

  it('renders ActionItem with verb title, why clause, cost/effort chips, and gain badge', () => {
    const action: ChosenAction = {
      id: 'bedroom-purifier-night',
      title: 'Run a HEPA air purifier in the bedroom overnight',
      why: 'You spend about a third of the day asleep in one room.',
      cost: 'mid',
      effort: 1,
      confidence: 'high',
      impact: { exposureDeltaPct: -28 },
    };
    const html = renderToStaticMarkup(<ActionItem action={action} />);
    expect(html).toContain('Run a HEPA air purifier in the bedroom overnight');
    expect(html).toContain('You spend about a third of the day asleep in one room.');
    expect(html).toContain('₹₹ Mid');
    expect(html).toContain('Easy');
    expect(html).toContain('↓ 28% exposure reduction');
  });

  it('renders ImpactBar with baseline vs planned reduction percentages', () => {
    const html = renderToStaticMarkup(
      <ImpactBar baseline={100} planned={64} co2eSavedKg={1.75} />
    );
    expect(html).toContain('Exposure Reduction Impact');
    expect(html).toContain('↓ 36% lower');
    expect(html).toContain('Baseline Exposure:');
    expect(html).toContain('With Clean-Air Plan:');
  });

  it('renders CommunityPack with scaled collective impact', () => {
    const html = renderToStaticMarkup(<CommunityPack initialHouseholds={120} />);
    expect(html).toContain('Community Smog Action &amp; RWA Pack');
    expect(html).toContain('Collective CO₂e avoided:');
    expect(html).toContain('Copy Notice');
  });

  it('renders CategoryIcon for all 6 NAQI categories', () => {
    const tiers = [0, 1, 2, 3, 4, 5];
    for (const t of tiers) {
      const html = renderToStaticMarkup(<CategoryIcon tier={t} />);
      expect(html).toContain('role="img"');
    }
  });

  it('renders SafetyNote with non-medical disclaimer and urgent care warning', () => {
    const html = renderToStaticMarkup(<SafetyNote />);
    expect(html).toContain('trouble breathing, chest pain');
    expect(html).toContain('Not Medical Advice');
  });
});
