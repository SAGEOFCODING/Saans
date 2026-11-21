import { describe, it, expect, afterEach } from 'vitest';
import { buildFacts, narratePlan, NarrationSchema } from '@/services/llm/narrate';
import { setLLMProviderForTesting, type LLMProvider } from '@/services/llm/provider';
import { assembleDayPlan } from '@/domain/plan';
import { priyaHousehold } from '../e2e/harness/fixtures';
import type { Air } from '@/domain/types';

const mockAir: Air = {
  at: new Date().toISOString(),
  aqi: 320,
  category: 'very-poor',
  dominant: 'pm25',
  pm25: 185,
  pm10: 290,
  stagnant: true,
  tempC: 17,
  rh: 68,
  windKmh: 4,
  visibilityKm: 2.1,
  ageMin: 0,
  hourly: [
    { t: '2026-11-21T07:00', aqi: 340, pm25: 200 },
    { t: '2026-11-21T13:00', aqi: 180, pm25: 90 },
  ],
  source: 'manual',
};

describe('Narrator & FACTS Builder (src/services/llm/narrate.ts)', () => {
  afterEach(() => {
    setLLMProviderForTesting(null);
  });

  describe('buildFacts Privacy Enforcement', () => {
    it('derives sensitiveMember boolean only and never exposes raw health flags', () => {
      const plan = assembleDayPlan(priyaHousehold, mockAir);
      const facts = buildFacts(plan, priyaHousehold, 'en');

      expect(typeof facts.sensitiveMember).toBe('boolean');
      expect(facts.sensitiveMember).toBe(true); // Priya household has infant sensitive member

      const serialized = JSON.stringify(facts);
      // Strict privacy check: no medical terms or raw health labels
      expect(serialized).not.toMatch(/asthma|bronchitis|copd|cardiovascular|disease|diagnosis/i);
    });

    it('faithfully preserves authentic air metrics in facts', () => {
      const plan = assembleDayPlan(priyaHousehold, mockAir);
      const facts = buildFacts(plan, priyaHousehold, 'en');

      expect(facts.air.aqi).toBe(320);
      expect(facts.air.pm25).toBe(185);
      expect(facts.air.stagnant).toBe(true);
      expect(facts.blocks.length).toBeGreaterThan(0);
    });
  });

  describe('narratePlan Fallback & AI Mode', () => {
    it('returns rules mode with template narration when provider is mock', async () => {
      const plan = assembleDayPlan(priyaHousehold, mockAir);
      const result = await narratePlan(plan, priyaHousehold, 'en');

      expect(result.mode).toBe('rules');
      expect(result.narration.headline).toBeDefined();
      expect(result.narration.summary.toLowerCase()).toContain('very poor');
      expect(result.narration.actions.length).toBeGreaterThan(0);
    });

    it('returns ai mode when Gemini provider produces valid narration', async () => {
      const plan = assembleDayPlan(priyaHousehold, mockAir);
      const mockGeminiProvider: LLMProvider = {
        name: 'gemini',
        async json<T>() {
          return {
            headline: 'Winter Smog Alert for New Delhi',
            summary: 'Air quality is very-poor. Recommended actions reduce daily exposure by 24%.',
            blocks: plan.blocks.map((b) => ({ id: b.id, intro: `${b.id} intro clause` })),
            actions: plan.blocks.flatMap((b) =>
              b.actions.map((a) => ({ id: a.id, tip: typeof a.title === 'string' ? a.title : a.title?.en || a.id, whyPlain: 'Helps protect health' }))
            ),
            watchouts: ['Keep windows sealed during stagnant hours.'],
          } as T;
        },
        async *stream() {
          yield { event: 'done', data: {} };
        },
      };

      setLLMProviderForTesting(mockGeminiProvider);
      const result = await narratePlan(plan, priyaHousehold, 'en');

      expect(result.mode).toBe('ai');
      expect(result.narration.headline).toBe('Winter Smog Alert for New Delhi');
    });

    it('falls back to rules mode if provider output violates safety guard', async () => {
      const plan = assembleDayPlan(priyaHousehold, mockAir);
      const badProvider: LLMProvider = {
        name: 'gemini',
        async json<T>() {
          return {
            headline: 'Dangerous advice',
            summary: 'Current AQI is 72. Take 5mg salbutamol.', // Violations: invented 72 and medication
            blocks: [],
            actions: [],
            watchouts: [],
          } as T;
        },
        async *stream() {
          yield { event: 'done', data: {} };
        },
      };

      setLLMProviderForTesting(badProvider);
      const result = await narratePlan(plan, priyaHousehold, 'en');

      // Must reject invalid output and fallback to safe rules mode
      expect(result.mode).toBe('rules');
      expect(result.narration.headline).not.toContain('Dangerous advice');
    });
  });

  describe('NarrationSchema validation', () => {
    it('validates compliant narration objects', () => {
      const valid = {
        headline: 'Clear guidance for winter air',
        summary: 'PM2.5 is elevated today.',
        blocks: [{ id: 'night', intro: 'Night sleep recommendations' }],
        actions: [{ id: 'a1', tip: 'Use bedroom purifier', whyPlain: 'Cleans air while resting' }],
        watchouts: ['Avoid outdoor exercise in morning.'],
      };
      const parsed = NarrationSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });
});
