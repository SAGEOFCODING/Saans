import type { LLMProvider, JsonRequest, StreamRequest, ChatEvent } from './provider';
import { getMockStreamEvents } from './mockStreamRules';
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
    const rawMsg = req.messages[req.messages.length - 1]?.content || '';
    const cleanMsg = rawMsg.replace(/<\/?user_data>/g, '').trim();
    const isHi = req.lang === 'hi' || /[\u0900-\u097F]/.test(cleanMsg);
    yield* getMockStreamEvents(cleanMsg, isHi, req.toolContext);
  }
}
