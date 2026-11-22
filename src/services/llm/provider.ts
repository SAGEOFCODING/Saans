import { z } from 'zod';
import type { ToolContext } from './tools';
import { MockProvider } from './mock';
import { GeminiProvider } from './gemini';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type ChatEvent =
  | { event: 'token'; data: { text: string } }
  | { event: 'tool'; data: { name: string; args: Record<string, unknown>; result?: unknown } }
  | { event: 'done'; data: Record<string, never> }
  | { event: 'error'; data: { error: { code: string; message: string } } };

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface JsonRequest<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
}

export interface StreamRequest {
  system: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  toolContext?: ToolContext;
  lang?: 'en' | 'hi';
}

export interface LLMProvider {
  name: 'mock' | 'gemini';
  json<T>(req: JsonRequest<T>): Promise<T>;
  stream(req: StreamRequest): AsyncIterable<ChatEvent>;
}

let testingProvider: LLMProvider | null = null;

export function setLLMProviderForTesting(provider: LLMProvider | null): void {
  testingProvider = provider;
}

export function getLLMProvider(): LLMProvider {
  if (testingProvider) return testingProvider;
  const envProvider = process.env.LLM_PROVIDER;
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  if (envProvider === 'gemini' || (hasKey && envProvider !== 'mock')) {
    return new GeminiProvider();
  }
  return new MockProvider();
}
