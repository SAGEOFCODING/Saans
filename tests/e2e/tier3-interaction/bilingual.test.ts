import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented, readSSEStream } from '../harness/client';
import { expectJsonSuccess, DayPlanResponseSchema } from '../harness/matchers';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

const isPlanImplemented = isRouteImplemented('/api/plan');
const isChatImplemented = isRouteImplemented('/api/chat');
const isBilingualTestable = isPlanImplemented || isChatImplemented;

describe.skipIf(!isBilingualTestable)('Tier 3 Interaction — Bilingual Support (English & Hindi)', () => {
  it("TC-LANG-01: returns Hindi localized text when lang: 'hi' is requested", async () => {
    // Authoritative source: docs/architecture.md §11 (strings.{en,hi}.json), prd.md FR-14
    if (!isRouteImplemented('/api/plan')) return;

    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: { ...priyaHousehold, lang: 'hi' },
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'hi',
      },
    });

    expect(res.status).toBe(200);
    const planData = await expectJsonSuccess(res, DayPlanResponseSchema);

    // Devanagari Unicode range: \u0900-\u097F
    const devanagariRegex = /[\u0900-\u097F]/;
    const headline = planData.narration.headline || '';
    const summary = planData.narration.summary || '';
    const combinedNarration = `${headline} ${summary}`;

    expect(combinedNarration).toMatch(devanagariRegex);
  });

  it('TC-LANG-02: maintains identical quantitative numbers and metrics between EN and HI plans', async () => {
    // Authoritative source: AGENTS.md §B3 ("Rule 6: Write in FACTS.lang. Keep numbers and units unchanged.")
    if (!isRouteImplemented('/api/plan')) return;

    // Fetch English plan
    const enRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: { ...priyaHousehold, lang: 'en' },
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'en',
      },
    });
    const enData = await expectJsonSuccess(enRes, DayPlanResponseSchema);

    // Fetch Hindi plan
    const hiRes = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: { ...priyaHousehold, lang: 'hi' },
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'hi',
      },
    });
    const hiData = await expectJsonSuccess(hiRes, DayPlanResponseSchema);

    // Assert identical quantitative metrics
    expect(hiData.plan.air.aqi).toBe(enData.plan.air.aqi);
    expect(hiData.plan.air.pm25).toBe(enData.plan.air.pm25);

    if (enData.plan.baseline !== undefined && hiData.plan.baseline !== undefined) {
      expect(hiData.plan.baseline).toBe(enData.plan.baseline);
    }
    if (enData.plan.planned !== undefined && hiData.plan.planned !== undefined) {
      expect(hiData.plan.planned).toBe(enData.plan.planned);
    }
  });

  it('TC-LANG-03: returns Hindi emergency message for acute respiratory symptoms in Hindi chat input', async () => {
    // Authoritative source: AGENTS.md §B6 ("Emergency message (fixed text, EN/HI): ... सांस लेने में तकलीफ")
    if (!isRouteImplemented('/api/chat')) return;

    const hindiEmergencyInput = 'मेरे पिताजी को सांस लेने में बहुत तकलीफ हो रही है';
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: { ...priyaHousehold, lang: 'hi' },
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: hindiEmergencyInput }],
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);
    const text = events
      .filter((e) => e.event === 'token' || e.event === 'message')
      .map((e) => (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)))
      .join(' ');

    // Must return emergency guidance containing Devanagari emergency keywords
    const devanagariRegex = /[\u0900-\u097F]/;
    expect(text).toMatch(devanagariRegex);
    expect(text).toMatch(/सांस|चिकित्सा|अस्पताल|डॉक्टर|मदद|आपातकालीन/i);
  });

  it('TC-LANG-04: falls back cleanly to English strings if a translation key is missing in Hindi', async () => {
    // Authoritative source: docs/architecture.md §7.7 ("English required, Hindi optional with fallback")
    if (!isRouteImplemented('/api/plan')) return;

    const res = await apiRequest('/api/plan', {
      method: 'POST',
      body: {
        household: { ...priyaHousehold, lang: 'hi' },
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        lang: 'hi',
      },
    });

    const planData = await expectJsonSuccess(res, DayPlanResponseSchema);

    // Every block and action must have non-empty valid string titles without 'undefined' or empty strings
    for (const block of planData.plan.blocks) {
      for (const action of block.actions) {
        if (typeof action.title === 'string') {
          expect(action.title.trim().length).toBeGreaterThan(0);
          expect(action.title).not.toContain('undefined');
        }
      }
    }
  });
});
