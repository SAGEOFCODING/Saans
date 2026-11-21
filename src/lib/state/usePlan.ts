'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DayPlan, Household, Location, Air } from '@/domain/types';

export interface Narration {
  headline: string;
  summary: string;
  tips: Array<{ id: string; text: string }>;
  careLine?: string;
}

export interface PlanMeta {
  mode: 'gemini' | 'mock' | 'rules';
  airSource: 'live' | 'cache' | 'manual';
  generatedAt: string;
}

export interface UsePlanReturn {
  plan: DayPlan | null;
  narration: Narration | null;
  meta: PlanMeta | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// In-memory cache by request payload key
const planCache = new Map<string, { plan: DayPlan; narration: Narration; meta: PlanMeta }>();

export function usePlan(
  household: Household,
  location: Location,
  lang: 'en' | 'hi',
  manualAir?: Partial<Air>,
  autoFetch = true
): UsePlanReturn {
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [narration, setNarration] = useState<Narration | null>(null);
  const [meta, setMeta] = useState<PlanMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeFetch = useCallback(async () => {
    const cacheKey = JSON.stringify({ household, location, lang, manualAir });
    const cached = planCache.get(cacheKey);
    if (cached) {
      setPlan(cached.plan);
      setNarration(cached.narration);
      setMeta(cached.meta);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household, location, lang, manualAir }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch plan (${res.status})`);
      }

      const data = await res.json();
      setPlan(data.plan);
      setNarration(data.narration);
      setMeta(data.meta);
      planCache.set(cacheKey, { plan: data.plan, narration: data.narration, meta: data.meta });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Plan generation failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [household, location, lang, manualAir]);

  useEffect(() => {
    if (autoFetch) {
      void executeFetch();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeFetch, autoFetch]);

  return {
    plan,
    narration,
    meta,
    isLoading,
    error,
    refetch: executeFetch,
  };
}
