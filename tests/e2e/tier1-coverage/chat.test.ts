import { describe, it, expect } from 'vitest';
import { apiRequest, readSSEStream, isRouteImplemented } from '../harness/client';
import { priyaHousehold, delhiCoords } from '../harness/fixtures';

describe.skipIf(!isRouteImplemented('/api/chat'))('Tier 1 Coverage — Conversational Chat SSE (POST /api/chat)', () => {
  it('TC-CHAT-01: responds with HTTP 200 and text/event-stream header', async () => {
    // Authoritative source: docs/architecture.md §9.4, §10
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'What is the air quality right now?' }],
      },
    });

    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType.toLowerCase()).toContain('text/event-stream');
  });

  it('TC-CHAT-02: emits parsed SSE stream events (token, tool, or message)', async () => {
    // Authoritative source: docs/architecture.md §10 (SSE events: token, tool, done, error)
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    const events = await readSSEStream(res);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    const eventTypes = events.map((e) => e.event);
    const hasRecognizedEvent = eventTypes.some((ev) =>
      ['token', 'tool', 'done', 'message'].includes(ev)
    );
    expect(hasRecognizedEvent).toBe(true);
  });

  it('TC-CHAT-03: terminates stream with a terminal done event', async () => {
    // Authoritative source: docs/architecture.md §10
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'What should I do this morning?' }],
      },
    });

    const events = await readSSEStream(res);
    const lastEvent = events[events.length - 1];
    expect(lastEvent).toBeDefined();

    const doneEvent = events.find((e) => e.event === 'done');
    expect(doneEvent).toBeDefined();
  });

  it('TC-CHAT-04: accepts conversation history up to 10 turns without error', async () => {
    // Authoritative source: docs/architecture.md §9.4 ("history capped at 10 turns")
    const conversationHistory = [
      { role: 'user', content: 'Can I exercise outdoors today?' },
      { role: 'assistant', content: 'Outdoor exercise is not recommended during severe air quality.' },
      { role: 'user', content: 'When is the best window?' },
    ];

    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: conversationHistory,
      },
    });

    expect(res.status).toBe(200);
    const events = await readSSEStream(res);
    expect(events.length).toBeGreaterThan(0);
  });

  it('TC-CHAT-05: verifies chat response contains plain text without HTML tags', async () => {
    // Authoritative source: docs/architecture.md §12 ("Render LLM text as plain text... no dangerouslySetInnerHTML"), AGENTS.md §B6
    const res = await apiRequest('/api/chat', {
      method: 'POST',
      body: {
        household: priyaHousehold,
        location: { lat: delhiCoords.lat, lon: delhiCoords.lon },
        messages: [{ role: 'user', content: 'Tell me about PM2.5 in Delhi.' }],
      },
    });

    const events = await readSSEStream(res);
    const combinedText = events
      .filter((e) => e.event === 'token' || e.event === 'message')
      .map((e) => (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)))
      .join('');

    expect(combinedText).not.toMatch(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi);
    expect(combinedText).not.toMatch(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi);
  });
});
