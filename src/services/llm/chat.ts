import type { Household, Location, Air } from '../../domain/types';
import { fetchAirData } from '../airData';
import { checkInput, validateChatOutput } from './guard';
import { ADVISOR_SYSTEM_PROMPT, wrapUserData } from './prompts';
import { TOOL_DEFINITIONS, type ToolContext } from './tools';
import { getLLMProvider, type ChatMessage, type ChatEvent } from './provider';

export interface ChatSessionParams {
  household: Household;
  location: Location;
  messages: ChatMessage[];
  manualAir?: Air;
}

export async function* runChat(params: {
  household: Household;
  location: Location;
  messages: ChatMessage[];
  manualAir?: Air;
}): AsyncIterable<ChatEvent> {
  const { household, location, messages, manualAir } = params;
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const isHindi = /[\u0900-\u097F]/.test(lastUserMsg) || (household as { lang?: string }).lang === 'hi';
  const inputCheck = checkInput(lastUserMsg, isHindi ? 'hi' : 'en');

  if (inputCheck.emergency) {
    yield { event: 'token', data: { text: inputCheck.message || '' } };
    yield { event: 'done', data: {} };
    return;
  }

  const trimmed = messages.slice(-10).map((m) =>
    m.role === 'user' ? { ...m, content: wrapUserData(m.content) } : m
  );

  let air = manualAir;
  if (!air) {
    try {
      air = await fetchAirData(location.lat, location.lon);
    } catch {
      yield { event: 'error', data: { error: { code: 'AIR_FETCH_FAILED', message: 'Could not retrieve air data' } } };
      return;
    }
  }

  const toolContext: ToolContext = { air, household };
  const provider = getLLMProvider();
  const stream = provider.stream({
    system: ADVISOR_SYSTEM_PROMPT,
    messages: trimmed,
    tools: TOOL_DEFINITIONS,
    toolContext,
  });

  for await (const chunk of stream) {
    if (chunk.event === 'token') {
      const { sanitized } = validateChatOutput(chunk.data.text);
      yield { event: 'token', data: { text: sanitized } };
    } else {
      yield chunk;
    }
  }
}
