import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getLLMProvider, setLLMProviderForTesting, type LLMProvider } from '@/services/llm/provider';
import { MockProvider } from '@/services/llm/mock';
import { GeminiProvider } from '@/services/llm/gemini';
import { NarrationSchema } from '@/services/llm/narrate';
import { NARRATOR_SYSTEM_PROMPT, ADVISOR_SYSTEM_PROMPT } from '@/services/llm/prompts';
import { priyaHousehold } from '../e2e/harness/fixtures';
import type { Air } from '@/domain/types';

const originalEnv = { ...process.env };

const mockAir: Air = {
  at: new Date().toISOString(),
  aqi: 280,
  category: 'poor',
  dominant: 'pm25',
  pm25: 140,
  pm10: 220,
  stagnant: false,
  tempC: 20,
  rh: 55,
  windKmh: 9,
  ageMin: 0,
  hourly: [],
  source: 'manual',
};

describe('LLM Provider Factory & Mock Provider (src/services/llm/provider.ts & mock.ts)', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    setLLMProviderForTesting(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    setLLMProviderForTesting(null);
  });

  describe('getLLMProvider Factory', () => {
    it('defaults to MockProvider when no GEMINI_API_KEY is configured', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.LLM_PROVIDER;
      const provider = getLLMProvider();
      expect(provider).toBeInstanceOf(MockProvider);
      expect(provider.name).toBe('mock');
    });

    it('returns MockProvider when LLM_PROVIDER is explicitly "mock" even if key is present', () => {
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.LLM_PROVIDER = 'mock';
      const provider = getLLMProvider();
      expect(provider).toBeInstanceOf(MockProvider);
      expect(provider.name).toBe('mock');
    });

    it('returns GeminiProvider when GEMINI_API_KEY is present and provider is not mock', () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.LLM_PROVIDER = 'gemini';
      const provider = getLLMProvider();
      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.name).toBe('gemini');
    });

    it('honors test provider override via setLLMProviderForTesting', () => {
      const custom: LLMProvider = {
        name: 'mock',
        async json<T>() { return {} as T; },
        async *stream() { yield { event: 'done', data: {} }; },
      };
      setLLMProviderForTesting(custom);
      expect(getLLMProvider()).toBe(custom);
    });
  });

  describe('MockProvider JSON & Stream', () => {
    it('MockProvider.json generates structured narration conforming to schema', async () => {
      const mock = new MockProvider();
      const facts = {
        air: { aqi: 280, category: 'poor', pm25: 140, stagnant: false },
        blocks: [{ id: 'night', actions: [{ id: 'a1', titleEn: 'Run Purifier', deltaPct: 20 }] }],
        lang: 'en',
      };
      const result = await mock.json({
        system: NARRATOR_SYSTEM_PROMPT,
        user: `<facts>${JSON.stringify(facts)}</facts>`,
        schema: NarrationSchema,
      });

      expect(result.headline).toBeDefined();
      expect(result.summary).toContain('poor');
      expect(result.blocks.length).toBe(1);
      expect(result.actions.length).toBe(1);
    });

    it('MockProvider.stream yields tool event and token events for air query', async () => {
      const mock = new MockProvider();
      const events = [];
      for await (const ev of mock.stream({
        system: ADVISOR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: 'What is the air quality right now?' }],
        toolContext: { air: mockAir, household: priyaHousehold },
      })) {
        events.push(ev);
      }

      expect(events.length).toBeGreaterThan(0);
      const toolEvent = events.find((e) => e.event === 'tool');
      expect(toolEvent).toBeDefined();
      if (toolEvent && toolEvent.event === 'tool') {
        expect(toolEvent.data.name).toBe('get_air_now');
      }

      const doneEvent = events.find((e) => e.event === 'done');
      expect(doneEvent).toBeDefined();
    });
  });
});
