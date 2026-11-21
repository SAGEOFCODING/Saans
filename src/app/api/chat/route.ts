import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HouseholdSchema, LocationSchema } from '@/domain/types';
import { checkRateLimit, getClientIp } from '@/services/rateLimit';
import { runChat } from '@/services/llm/chat';
import { getLLMProvider } from '@/services/llm/provider';

const ChatRequestSchema = z.object({
  household: HouseholdSchema,
  location: LocationSchema.optional().default({ lat: 28.61, lon: 77.21 }),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(2000),
      })
    )
    .min(1)
    .max(20),
});

function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest): Promise<Response> {
  const start = Date.now();
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, 'chat', 10, 60000);

  if (!rate.allowed) {
    const seconds = Math.max(1, Math.ceil(rate.resetMs / 1000));
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded for chat' } },
      { status: 429, headers: { 'Retry-After': String(seconds) } }
    );
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Failed to read request body' } }, { status: 400 });
  }

  if (rawText.length > 16384) {
    return NextResponse.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request exceeds 16 KB' } }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON' } }, { status: 400 });
  }

  const validation = ChatRequestSchema.safeParse(parsed);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: issue ? issue.message : 'Invalid request' } },
      { status: 400 }
    );
  }

  const { household, location, messages } = validation.data;
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of runChat({ household, location, messages })) {
          controller.enqueue(encoder.encode(formatSSE(chunk.event, chunk.data)));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Chat error';
        controller.enqueue(encoder.encode(formatSSE('error', { error: { code: 'CHAT_ERROR', message: msg } })));
      } finally {
        controller.close();
      }
    },
  });

  const provider = getLLMProvider();
  console.info(JSON.stringify({ route: '/api/chat', ms: Date.now() - start, mode: provider.name }));

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
