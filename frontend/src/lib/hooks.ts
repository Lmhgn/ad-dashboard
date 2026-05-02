/**
 * Custom React Hooks for data fetching
 * Handles loading, error, and caching
 */

'use client';

import { useState, useEffect } from 'react';
import * as api from './api';
import type { Summary, TrendMetrics, CategoryBreakdown, BudgetStatus, Insight } from './types';

// ============================================================================
// GENERIC FETCH HOOK
// ============================================================================

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, isLoading, error };
}

// ============================================================================
// SPECIFIC HOOKS
// ============================================================================

export function useSummary() {
  return useFetch<Summary>(() => api.getSummary(), []);
}

export function useTrends() {
  return useFetch<TrendMetrics>(() => api.getTrends(), []);
}

export function useCategories(limit?: number, startDate?: string, endDate?: string) {
  return useFetch<CategoryBreakdown[]>(
    () => api.getCategories(limit, startDate, endDate),
    [limit, startDate, endDate],
  );
}

export function useBudgetStatus(month?: string) {
  return useFetch<BudgetStatus[]>(() => api.getBudgetStatus(month), [month]);
}

export function useInsights(limit?: number) {
  return useFetch<Insight[]>(() => api.getInsights(limit), [limit]);
}

export function useMonthlySummary(yearMonth: string) {
  return useFetch(() => api.getMonthlySummary(yearMonth), [yearMonth]);
}

export function useDailySummary(date: string) {
  return useFetch(() => api.getDailySummary(date), [date]);
}
