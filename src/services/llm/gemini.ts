import { GoogleGenAI } from '@google/genai';
import type { LLMProvider, JsonRequest, StreamRequest, ChatEvent } from './provider';
import { executeTool } from './tools';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini' as const;

  private getClient(): { client: GoogleGenAI; model: string } {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    return { client: new GoogleGenAI({ apiKey }), model };
  }

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const { client, model } = this.getClient();
    const response = await client.models.generateContent({
      model,
      contents: req.user,
      config: {
        systemInstruction: req.system,
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return req.schema.parse(parsed);
  }

  async *stream(req: StreamRequest): AsyncIterable<ChatEvent> {
    const { client, model } = this.getClient();
    const contents = req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const factsPrompt = req.toolContext
      ? `\nFACTS:\n- Current Air: AQI ${req.toolContext.air.aqi} (${req.toolContext.air.category}), PM2.5 ${req.toolContext.air.pm25} µg/m³, PM10 ${req.toolContext.air.pm10} µg/m³, Temperature ${req.toolContext.air.tempC}°C, Wind ${req.toolContext.air.windKmh} km/h, Stagnant: ${req.toolContext.air.stagnant}.\n- Household: ${req.toolContext.household.members.length} members, home: ${req.toolContext.household.home.type}, budget: ${req.toolContext.household.budget}, purifier: ${req.toolContext.household.home.purifier}.\n- Language: ${req.lang === 'hi' ? 'Hindi (Devanagari)' : 'English'}.`
      : '';

    try {
      const responseStream = await client.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: req.system + factsPrompt,
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0 && req.toolContext) {
          for (const call of chunk.functionCalls) {
            const args = (call.args as Record<string, unknown>) || {};
            const result = await executeTool(call.name || '', args, req.toolContext);
            yield { event: 'tool', data: { name: call.name || '', args, result } };
          }
        }
        if (chunk.text) {
          yield { event: 'token', data: { text: chunk.text } };
        }
      }
      yield { event: 'done', data: {} };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gemini stream failed';
      yield { event: 'error', data: { error: { code: 'GEMINI_STREAM_ERROR', message } } };
    }
  }
}
