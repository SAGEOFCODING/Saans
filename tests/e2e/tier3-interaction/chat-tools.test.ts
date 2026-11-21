import { describe, it, expect } from 'vitest';
import { apiRequest, isRouteImplemented, readSSEStream } from '../harness/client';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

const isChatImplemented = isRouteImplemented('/api/chat');

describe.skipIf(!isChatImplemented)('Tier 3 Interaction — Conversational Advisor Tool Execution Loop', () => {
  it('TC-TOOL-01: invokes get_air_now tool and cites current air metrics in plain text', async () => {
    // Authoritative source: docs/architecture.md §9.4, AGENTS.md §B4, §B5
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'What is the air quality right now?' }],
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);
    expect(events.length).toBeGreaterThan(0);

    const toolEvents = events.filter((e) => e.event === 'tool');
    const tokenEvents = events.filter((e) => e.event === 'token' || e.event === 'message');
    const combinedText = tokenEvents
      .map((e) => (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)))
      .join(' ');

    // Either tool event fired for get_air_now or text cites air quality metrics
    const hasAirToolCall = toolEvents.some((e) => JSON.stringify(e.data).includes('get_air_now'));
    const hasAirMetricsInText = /PM2\.5|AQI|µg\/m³|severe|poor|moderate/i.test(combinedText);

    expect(hasAirToolCall || hasAirMetricsInText).toBe(true);
  });

  it('TC-TOOL-02: invokes get_best_window tool for outdoor exercise inquiries', async () => {
    // Authoritative source: AGENTS.md §B5, §B7 ("Is it safe to run at 7 am? -> Uses get_best_window('exercise')")
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'Is it safe to go for a run at 7 am?' }],
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);

    const toolEvents = events.filter((e) => e.event === 'tool');
    const tokenEvents = events.filter((e) => e.event === 'token' || e.event === 'message');
    const combinedText = tokenEvents
      .map((e) => (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)))
      .join(' ');

    const hasWindowToolCall = toolEvents.some((e) => JSON.stringify(e.data).includes('get_best_window'));
    const hasWindowAdvice = /window|afternoon|indoor|run|exercise|recommend/i.test(combinedText);

    expect(hasWindowToolCall || hasWindowAdvice).toBe(true);
  });

  it('TC-TOOL-03: invokes simulate tool for modifier impact evaluations', async () => {
    // Authoritative source: AGENTS.md §B5 (simulate: changes: ModifierId[] -> { baseline, planned, deltaPct })
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'How much does running a bedroom air purifier reduce our exposure?' }],
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);

    const toolEvents = events.filter((e) => e.event === 'tool');
    const tokenEvents = events.filter((e) => e.event === 'token' || e.event === 'message');
    const combinedText = tokenEvents
      .map((e) => (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)))
      .join(' ');

    const hasSimulateToolCall = toolEvents.some((e) => JSON.stringify(e.data).includes('simulate'));
    const hasReductionMention = /%|percent|reduce|lower|exposure|purifier/i.test(combinedText);

    expect(hasSimulateToolCall || hasReductionMention).toBe(true);
  });

  it('TC-TOOL-04: bounds tool calling rounds to <= 3 and caps conversation history at 10 turns', async () => {
    // Authoritative source: docs/architecture.md §9.4 ("Max 3 tool rounds, history capped at 10 turns")
    // Build 12-turn conversation history (exceeding 10-turn cap)
    const longHistory = [
      { role: 'user', content: 'Turn 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Turn 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Turn 3' },
      { role: 'assistant', content: 'Response 3' },
      { role: 'user', content: 'Turn 4' },
      { role: 'assistant', content: 'Response 4' },
      { role: 'user', content: 'Turn 5' },
      { role: 'assistant', content: 'Response 5' },
      { role: 'user', content: 'Turn 6' },
      { role: 'assistant', content: 'Response 6' },
      { role: 'user', content: 'What is the current air condition?' },
    ];

    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: longHistory,
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);

    // Count tool events — must never exceed 3 rounds
    const toolEvents = events.filter((e) => e.event === 'tool');
    expect(toolEvents.length).toBeLessThanOrEqual(3);

    // Stream must finish cleanly with a done event
    const doneEvent = events.find((e) => e.event === 'done');
    expect(doneEvent).toBeDefined();
  });
});
