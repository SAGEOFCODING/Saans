'use client';

import { useState, useCallback, useRef } from 'react';
import { Household, Location } from '@/domain/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: string[];
  isEmergency?: boolean;
}

const RED_FLAG_PATTERNS = [
  /trouble\s+breathing/i,
  /can'?t\s+breathe/i,
  /cannot\s+breathe/i,
  /chest\s+pain/i,
  /faint/i,
  /blue\s+lips/i,
  /severe\s+(cough|gasp)/i,
  /सांस\s*(नहीं|फूल)/,
  /सीने\s*में\s*दर्द/,
  /बेहोश/,
];

const EMERGENCY_TEXT = {
  en: 'If you or someone with you has trouble breathing, chest pain, fainting or severe symptoms, seek urgent medical care now. Call your local emergency number (112 / 102).',
  hi: 'यदि आपको या आपके साथ किसी को सांस लेने में कठिनाई, सीने में दर्द, बेहोशी या गंभीर लक्षण हैं, तो तुरंत आपातकालीन चिकित्सा सहायता लें। अपने स्थानीय आपातकालीन नंबर (112 / 102) पर कॉल करें।',
};

export function useChat(household: Household, location: Location, lang: 'en' | 'hi' = 'en') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setError(null);

      // Check red-flag symptoms client-side for immediate response
      const isRedFlag = RED_FLAG_PATTERNS.some((rx) => rx.test(trimmed));
      if (isRedFlag) {
        const emergencyMsg: ChatMessage = {
          id: `emergency-${Date.now()}`,
          role: 'assistant',
          content: EMERGENCY_TEXT[lang] || EMERGENCY_TEXT.en,
          isEmergency: true,
        };
        setMessages((prev) => [...prev, emergencyMsg]);
        return;
      }

      setIsStreaming(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const assistantMsgId = `assistant-${Date.now()}`;
      let accumulatedContent = '';
      const toolCallsList: string[] = [];

      try {
        const payloadMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household,
            location,
            messages: payloadMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Chat request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No readable stream available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const trimmedBlock = block.trim();
            if (!trimmedBlock) continue;

            const eventMatch = trimmedBlock.match(/event:\s*([a-z_]+)/i);
            const dataMatch = trimmedBlock.match(/data:\s*(.+)$/m);
            const eventType = eventMatch ? eventMatch[1] : 'message';
            const rawData = dataMatch ? dataMatch[1] : '';

            if (eventType === 'token') {
              try {
                const parsed = JSON.parse(rawData);
                accumulatedContent += parsed.token || '';
                setMessages((prev) => {
                  const filtered = prev.filter((m) => m.id !== assistantMsgId);
                  return [
                    ...filtered,
                    {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: accumulatedContent,
                      toolCalls: toolCallsList.length > 0 ? [...toolCallsList] : undefined,
                    },
                  ];
                });
              } catch {
                // Ignore parse errors on partial chunks
              }
            } else if (eventType === 'tool') {
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.tool) {
                  toolCallsList.push(parsed.tool);
                }
              } catch {
                // Ignore tool payload parse failure
              }
            } else if (eventType === 'error') {
              try {
                const parsed = JSON.parse(rawData);
                setError(parsed.error?.message || 'Chat error occurred');
              } catch {
                setError('Chat error occurred');
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Chat communication failed';
        setError(msg);
      } finally {
        setIsStreaming(false);
      }
    },
    [household, location, lang, messages, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}
