'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Household, Location } from '@/domain/types';
import { useChat } from '@/hooks/useChat';
import { CloseIcon, AlertIcon } from './Icons';

interface ChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household;
  location: Location;
  lang?: 'en' | 'hi';
}

const PROMPTS = [
  { en: 'Can my child play in the park at 4 pm?', hi: 'क्या मेरा बच्चा शाम 4 बजे पार्क में खेल सकता है?' },
  { en: 'Is it safe to go for a morning run?', hi: 'क्या आज सुबह की सैर पर जाना सुरक्षित है?' },
  { en: 'Does a cloth or surgical mask help in smog?', hi: 'क्या कपड़े या सर्जिकल मास्क से स्मॉग रुकता है?' },
  { en: 'Where should I place the air purifier?', hi: 'कमरे में एयर प्यूरीफायर कहां रखना चाहिए?' },
];

export default function ChatSheet({ isOpen, onClose, household, location, lang = 'en' }: ChatSheetProps) {
  const [input, setInput] = useState('');
  const { messages, isStreaming, error, sendMessage } = useChat(household, location);
  const isHi = lang === 'hi';
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management & Escape key trap
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus close button on mount
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-sheet-title"
    >
      <div
        ref={drawerRef}
        className="flex h-full w-full sm:max-w-md flex-col bg-surface shadow-2xl border-l border-line"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h3 id="chat-sheet-title" className="text-base font-bold text-ink">
              {isHi ? 'सांस सलाहकार (Chat)' : 'Saans Clean-Air Advisor'}
            </h3>
            <p className="text-xs text-ink-muted">
              {isHi ? 'दैनिक आदतों व स्वच्छ वायु पर प्रश्न पूछें' : 'Grounded guidance on routines, indoor air & smog'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-sky"
            aria-label="Close chat assistant"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Emergency Medical Care Warning Banner */}
        <div className="flex items-center gap-2 border-b border-caution/20 bg-caution/10 px-4 py-2 text-xs text-caution">
          <AlertIcon size={16} className="shrink-0" />
          <span>
            {isHi
              ? 'आपातकालीन सांस की तकलीफ होने पर तुरंत 112/102 पर कॉल करें।'
              : 'For severe breathlessness or chest pain, seek immediate emergency care.'}
          </span>
        </div>

        {/* Messages Container with live region */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="space-y-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {isHi ? 'सुझाए गए प्रश्न:' : 'Suggested Questions:'}
              </p>
              {PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(p[isHi ? 'hi' : 'en'])}
                  className="w-full text-left rounded-control border border-line p-2 text-xs text-ink hover:border-sky hover:bg-sky/5 transition-colors focus:ring-2 focus:ring-sky focus:outline-none"
                >
                  {p[isHi ? 'hi' : 'en']}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-panel text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-8 bg-sky text-on-sky font-medium'
                    : 'mr-8 bg-haze text-ink border border-line'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          )}
          {isStreaming && (
            <div className="text-xs text-ink-muted italic pl-2" aria-live="polite">
              {isHi ? 'सलाहकार विचार कर रहा है...' : 'Advisor is typing...'}
            </div>
          )}
          {error && <div className="text-xs text-danger-text pl-2">{error}</div>}
        </div>

        {/* Hidden screen-reader announcement for streamed response completion */}
        <div aria-live="polite" className="sr-only">
          {!isStreaming && lastAssistantMessage ? lastAssistantMessage : ''}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="border-t border-line p-3 flex gap-2 bg-surface">
          <label htmlFor="chat-message-input" className="sr-only">
            {isHi ? 'सलाहकार के लिए आपका प्रश्न' : 'Your question for the advisor'}
          </label>
          <input
            id="chat-message-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isHi ? 'प्रश्न पूछें (उदा. क्या 7 बजे दौड़ना ठीक है?)...' : 'Ask about air quality or routines...'
            }
            disabled={isStreaming}
            className="flex-1 rounded-control border border-line px-3 py-2 text-xs text-ink focus:border-sky focus:outline-none focus:ring-1 focus:ring-sky disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-control bg-sky px-4 py-2 text-xs font-bold text-on-sky hover:bg-sky-deep disabled:opacity-40 focus:ring-2 focus:ring-sky focus:outline-none"
          >
            {isHi ? 'भेजें' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
