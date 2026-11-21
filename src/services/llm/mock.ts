import type { LLMProvider, JsonRequest, StreamRequest, ChatEvent } from './provider';
import { executeTool, toolLookupPlaybook } from './tools';
import stringsEn from '../../data/strings.en.json';
import stringsHi from '../../data/strings.hi.json';

interface ExtractedFacts {
  air?: { aqi: number; category: string; pm25: number; stagnant?: boolean };
  blocks?: Array<{ id: string; actions?: Array<{ id: string; titleEn?: string; deltaPct?: number }> }>;
  civic?: string;
  lang?: 'en' | 'hi';
}

export class MockProvider implements LLMProvider {
  readonly name = 'mock' as const;

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const match = req.user.match(/<facts>([\s\S]*?)<\/facts>/);
    const facts: ExtractedFacts = match ? JSON.parse(match[1]) : {};
    const lang = facts.lang === 'hi' ? 'hi' : 'en';
    const s = lang === 'hi' ? stringsHi : stringsEn;
    const cat = facts.air?.category || 'moderate';
    const headline = String(s.templateNarration.headlineModerate);
    const summary = `${s.templateNarration.summaryPrefix} ${cat}. ${s.templateNarration.summaryReduction} 24%.`;

    const blocks = (facts.blocks || []).map((b) => ({
      id: b.id,
      intro: lang === 'hi' ? `${b.id} सुझाव` : `${b.id} recommendations`,
    }));

    const actions = (facts.blocks || []).flatMap((b) =>
      (b.actions || []).map((a) => ({
        id: a.id,
        tip: a.titleEn || a.id,
        whyPlain: lang === 'hi' ? 'प्रदूषण से सुरक्षा में सहायक।' : 'Helps lower exposure during peak hours.',
      }))
    );

    const watchouts: string[] = [];
    if (facts.air?.stagnant) {
      watchouts.push(lang === 'hi' ? 'हवा रुकी हुई है।' : 'Atmospheric stagnation detected: still, cold air traps smoke.');
    }
    if (facts.civic) watchouts.push(facts.civic);

    const payload = { headline, summary, blocks, actions, watchouts };
    return req.schema.parse(payload);
  }

  async *stream(req: StreamRequest): AsyncIterable<ChatEvent> {
    const lastMsg = req.messages[req.messages.length - 1]?.content || '';
    const ctx = req.toolContext;

    if (/ignore\s+previous|say\s+aqi\s+is\s+50/i.test(lastMsg)) {
      yield* this.yieldTokens('I cannot ignore safety guidelines or modify reported air quality metrics. Air quality is monitored through authentic data.');
      return;
    }
    if (/dose|salbutamol|inhaler|prescription/i.test(lastMsg)) {
      yield* this.yieldTokens('I cannot prescribe medication doses or provide medical diagnoses. Please consult a qualified doctor or pharmacist.');
      return;
    }
    if (/poem|cats|cat\b|story|joke/i.test(lastMsg)) {
      yield* this.yieldTokens('I focus exclusively on air quality, household routines, and low-emission choices. How can I assist you with clean air today?');
      return;
    }
    if (/purifier|filter|simulate|exposure/i.test(lastMsg) && ctx) {
      const res = (await executeTool('simulate', { changes: ['bedroom-purifier-night'] }, ctx)) as { deltaPct: number };
      yield { event: 'tool', data: { name: 'simulate', args: { changes: ['bedroom-purifier-night'] }, result: res } };
      yield* this.yieldTokens(`Running a bedroom air purifier overnight reduces household exposure by approximately ${res.deltaPct}%.`);
      return;
    }
    if (/(?:go\s+for\s+a\s+)?run\b|walk|exercise|window|7\s*am/i.test(lastMsg) && ctx) {
      const res = await executeTool('get_best_window', { activity: 'exercise' }, ctx);
      yield { event: 'tool', data: { name: 'get_best_window', args: { activity: 'exercise' }, result: res } };
      yield* this.yieldTokens('The best window for outdoor exercise is in the afternoon. Early morning hours around 7 am have the highest pollution.');
      return;
    }
    if (/plant|houseplant|steam|cloth/i.test(lastMsg)) {
      const topic = /plant/i.test(lastMsg) ? 'houseplants_myth' : 'steam_myth';
      const res = toolLookupPlaybook(topic);
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic }, result: res } };
      yield* this.yieldTokens('Common houseplants do not meaningfully remove fine PM2.5 in real-world homes. HEPA filtration is recommended.');
      return;
    }

    if (ctx) {
      const res = (await executeTool('get_air_now', {}, ctx)) as { aqi: number; pm25: number; category: string };
      yield { event: 'tool', data: { name: 'get_air_now', args: {}, result: res } };
      yield* this.yieldTokens(`Right now, PM2.5 is ${res.pm25} µg/m³ and the AQI is ${res.aqi} (${res.category}). Keep windows closed during peak hours.`);
      return;
    }
    yield* this.yieldTokens('Saans is monitoring current urban air quality conditions. How can I assist your family today?');
  }

  private async *yieldTokens(text: string): AsyncIterable<ChatEvent> {
    const parts = text.split(' ');
    for (let i = 0; i < parts.length; i++) {
      const chunk = i === parts.length - 1 ? parts[i] : parts[i] + ' ';
      yield { event: 'token', data: { text: chunk } };
    }
    yield { event: 'done', data: {} };
  }
}
