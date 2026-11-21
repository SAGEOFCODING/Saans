import { describe, it, expect } from 'vitest';
import {
  toolGetAirNow,
  toolGetBestWindow,
  toolGetPlanActions,
  toolSimulate,
  toolLookupPlaybook,
  executeTool,
  TOOL_DEFINITIONS,
  type ToolContext,
} from '@/services/llm/tools';
import { priyaHousehold } from '../e2e/harness/fixtures';
import type { Air } from '@/domain/types';

const mockAir: Air = {
  at: new Date().toISOString(),
  aqi: 310,
  category: 'very-poor',
  dominant: 'pm25',
  pm25: 180,
  pm10: 290,
  stagnant: true,
  tempC: 16,
  rh: 65,
  windKmh: 5,
  visibilityKm: 2.5,
  ageMin: 0,
  hourly: [
    { t: '2026-11-21T06:00', aqi: 350, pm25: 210 },
    { t: '2026-11-21T07:00', aqi: 340, pm25: 200 },
    { t: '2026-11-21T13:00', aqi: 150, pm25: 75 },
    { t: '2026-11-21T14:00', aqi: 160, pm25: 80 },
  ],
  source: 'live',
};

const ctx: ToolContext = {
  air: mockAir,
  household: priyaHousehold,
};

describe('Domain Tools Unit Tests (src/services/llm/tools.ts)', () => {
  it('TOOL_DEFINITIONS exports all 5 read-only tools matching AGENTS.md §B5', () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name);
    expect(names).toContain('get_air_now');
    expect(names).toContain('get_best_window');
    expect(names).toContain('get_plan_actions');
    expect(names).toContain('simulate');
    expect(names).toContain('lookup_playbook');
  });

  describe('toolGetAirNow', () => {
    it('returns air snapshot with authentic metrics', () => {
      const res = toolGetAirNow(ctx);
      expect(res.aqi).toBe(310);
      expect(res.pm25).toBe(180);
      expect(res.category).toBe('very-poor');
      expect(res.stagnant).toBe(true);
      expect(res.visibilityKm).toBe(2.5);
      expect(res.source).toBe('live');
    });
  });

  describe('toolGetBestWindow', () => {
    it('returns best and worst windows for exercise', () => {
      const res = toolGetBestWindow('exercise', ctx);
      expect(res.best).toBeDefined();
      expect(res.worst).toBeDefined();
      expect(res.pm25AtBest).toBeLessThanOrEqual(res.pm25NowAvg);
    });
  });

  describe('toolGetPlanActions', () => {
    it('returns recommended actions from plan', () => {
      const actions = toolGetPlanActions(undefined, ctx);
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].id).toBeDefined();
      expect(actions[0].title).toBeDefined();
    });

    it('filters actions by domain when requested', () => {
      const indoorActions = toolGetPlanActions('indoor', ctx);
      expect(indoorActions.every((a) => a.domain === 'indoor')).toBe(true);
    });
  });

  describe('toolSimulate', () => {
    it('computes exposure delta reduction when night purifier is simulated', () => {
      const res = toolSimulate(['bedroom-purifier-night'], ctx);
      expect(res.baseline).toBeGreaterThan(0);
      expect(res.planned).toBeLessThan(res.baseline);
      expect(res.deltaPct).toBeGreaterThan(0);
    });

    it('returns 0 delta when unknown changes are passed', () => {
      const res = toolSimulate(['unknown-action-id'], ctx);
      expect(res.deltaPct).toBe(0);
    });
  });

  describe('toolLookupPlaybook', () => {
    it('retrieves vetted guidance snippet for houseplants_myth', () => {
      const res = toolLookupPlaybook('houseplants_myth');
      expect(res.title).toBeDefined();
      expect(res.summary).toContain('do not meaningfully remove fine PM2.5');
      expect(res.source_hint).toBeDefined();
    });

    it('returns error for unlisted topic', () => {
      const res = toolLookupPlaybook('unlisted_topic');
      expect(res.error).toBeDefined();
    });
  });

  describe('executeTool dispatcher', () => {
    it('dispatches to tool handlers correctly', async () => {
      const airRes = (await executeTool('get_air_now', {}, ctx)) as { aqi: number };
      expect(airRes.aqi).toBe(310);

      const pbRes = (await executeTool('lookup_playbook', { topic: 'diy_filter' }, ctx)) as { title: string };
      expect(pbRes.title).toContain('DIY Box-Fan Filter');
    });
  });
});
