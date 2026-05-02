/**
 * API Client - Fetch data from backend
 * All requests go to /api/* endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================================
// SUMMARY & TRENDS
// ============================================================================

export async function getSummary() {
  const res = await fetch(`${API_URL}/api/analytics/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  const data = await res.json();
  return data.data;
}

export async function getTrends() {
  const res = await fetch(`${API_URL}/api/analytics/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  const data = await res.json();
  return data.data;
}

// ============================================================================
// CATEGORIES & ANALYTICS
// ============================================================================

export async function getCategories(limit?: number, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const res = await fetch(`${API_URL}/api/analytics/categories?${params}`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.data;
}

export async function getDailySummary(date: string) {
  const res = await fetch(`${API_URL}/api/analytics/daily/${date}`);
  if (!res.ok) throw new Error('Failed to fetch daily summary');
  const data = await res.json();
  return data.data;
}

export async function getMonthlySummary(yearMonth: string) {
  const res = await fetch(`${API_URL}/api/analytics/monthly/${yearMonth}`);
  if (!res.ok) throw new Error('Failed to fetch monthly summary');
  const data = await res.json();
  return data.data;
}

// ============================================================================
// BUDGET
// ============================================================================

export async function getBudgetStatus(month?: string) {
  const params = new URLSearchParams();
  if (month) params.append('month', month);

  const res = await fetch(`${API_URL}/api/analytics/budget?${params}`);
  if (!res.ok) throw new Error('Failed to fetch budget status');
  const data = await res.json();
  return data.data;
}

// ============================================================================
// INSIGHTS
// ============================================================================

export async function getInsights(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const res = await fetch(`${API_URL}/api/analytics/insights?${params}`);
  if (!res.ok) throw new Error('Failed to fetch insights');
  const data = await res.json();
  return data.data;
}

export async function getInsightsByType(type: string) {
  const res = await fetch(`${API_URL}/api/analytics/insights/${type}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type} insights`);
  const data = await res.json();
  return data.data;
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('start_date', filters.startDate);
  if (filters?.endDate) params.append('end_date', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const res = await fetch(`${API_URL}/api/transactions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  return data.data;
}

export async function getTransaction(id: number) {
  const res = await fetch(`${API_URL}/api/transactions/${id}`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  const data = await res.json();
  return data.data;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}
