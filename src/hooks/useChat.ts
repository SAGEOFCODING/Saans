'use client';

import { useState, useCallback } from 'react';
import type { Household, Location } from '@/domain/types';

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const RED_FLAGS = [
  "can't breathe",
  'cannot breathe',
  'trouble breathing',
  'difficulty breathing',
  'chest pain',
  'fainted',
  'fainting',
  'blue lips',
  'सांस लेने में तकलीफ',
  'सांस नहीं आ रही',
  'सीने में दर्द',
];

const EMERGENCY_TEXT =
  'If you or someone with you has trouble breathing, chest pain, fainting or severe symptoms, seek urgent medical care now. Call your local emergency number.';

export function useChat(household: Household, location: Location) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMsg = { role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setError(null);

      // Local safety intercept
      const lower = trimmed.toLowerCase();
      if (RED_FLAGS.some((rf) => lower.includes(rf))) {
        setMessages((prev) => [...prev, { role: 'assistant', content: EMERGENCY_TEXT }]);
        return;
      }

      setIsStreaming(true);
      const assistantMsg: ChatMsg = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household,
            location,
            messages: [...messages, userMsg],
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || `Chat error: HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const eventLine = block.split('\n').find((l) => l.startsWith('event: '));
            const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
            const event = eventLine ? eventLine.replace('event: ', '').trim() : 'message';
            const dataStr = dataLine ? dataLine.replace('data: ', '').trim() : '';

            if (event === 'token' && dataStr) {
              const parsed = JSON.parse(dataStr);
              if (parsed?.text) {
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === 'assistant') {
                    last.content += parsed.text;
                  }
                  return copy;
                });
              }
            } else if (event === 'error' && dataStr) {
              const parsed = JSON.parse(dataStr);
              throw new Error(parsed?.error?.message || 'Chat error');
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Chat error';
        setError(msg);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant' && !last.content) {
            last.content = 'Sorry, connection was interrupted. Please retry.';
          }
          return copy;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [household, location, messages, isStreaming]
  );

  return { messages, isStreaming, error, sendMessage };
}
