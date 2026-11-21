'use client';

import { useState, useCallback } from 'react';
import type { Household, Location, DayPlan, Air } from '@/domain/types';
import { loadSessionItem, saveSessionItem } from '@/lib/storage';

export interface PlanMeta {
  mode: 'llm' | 'rules';
  airSource: 'live' | 'cache' | 'manual';
  airAgeMin: number;
}

export interface PlanNarration {
  headline?: string;
  summary?: string;
  actions?: Array<{ id: string; title: string; why: string }>;
}

export function usePlan() {
  const [plan, setPlan] = useState<DayPlan | null>(() => loadSessionItem<DayPlan | null>('saans_plan', null));
  const [narration, setNarration] = useState<PlanNarration | null>(() =>
    loadSessionItem<PlanNarration | null>('saans_narration', null)
  );
  const [meta, setMeta] = useState<PlanMeta | null>(() => loadSessionItem<PlanMeta | null>('saans_meta', null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(
    async (household: Household, location: Location, lang: 'en' | 'hi', manualAir?: Air) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household,
            location,
            lang,
            manualAir,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || `Plan error: HTTP ${res.status}`);
        }

        const data = await res.json();
        setPlan(data.plan);
        setNarration(data.narration);
        setMeta(data.meta);

        saveSessionItem('saans_plan', data.plan);
        saveSessionItem('saans_narration', data.narration);
        saveSessionItem('saans_meta', data.meta);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to generate plan';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { plan, narration, meta, loading, error, fetchPlan };
}
