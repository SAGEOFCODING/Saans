import React from 'react';
import type { Household } from '@/domain/types';

export interface SafetyNoteProps {
  lang?: Household['lang'];
}

export function SafetyNote({ lang = 'en' }: SafetyNoteProps) {
  return (
    <footer className="border-t border-line py-6 text-xs text-ink-muted space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p>
          <strong>{lang === 'hi' ? 'चिकित्सीय सलाह नहीं:' : 'Not Medical Advice:'}</strong>{' '}
          {lang === 'hi'
            ? 'साँस द्वारा दी गई सिफारिशें वायुमंडलीय और निस्पंदन मॉडल पर आधारित पर्यावरणीय योजना अनुमान हैं, चिकित्सीय नुस्खे नहीं।'
            : 'Saans recommendations are environmental planning heuristics based on atmospheric and filtration models, not clinical diagnoses.'}
        </p>
      </div>
      <p className="p-3 bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-control text-danger-text font-medium leading-relaxed">
        {lang === 'hi'
          ? 'यदि आपको या आपके साथ किसी को सांस लेने में गंभीर कठिनाई, सीने में दर्द या बेहोशी है, तो तुरंत निकटतम अस्पताल जाएं या आपातकालीन नंबर 112 / 102 पर संपर्क करें।'
          : 'If you or someone with you has trouble breathing, chest pain, fainting or severe symptoms, seek urgent medical care now. Call your local emergency number (112 / 102).'}
      </p>
    </footer>
  );
}
