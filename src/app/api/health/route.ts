import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const llmProvider = process.env.LLM_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'mock');
  const safeLlm = llmProvider === 'gemini' ? 'gemini' : 'mock';

  return NextResponse.json(
    {
      ok: true,
      llm: safeLlm,
      time: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
