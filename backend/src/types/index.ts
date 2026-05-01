/**
 * Core type definitions for the Spend Analytics Dashboard
 */

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface User {
  id: number;
  email: string;
  name: string;
  currency: string;
  timezone: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  merchant_id: number | null;
  original_merchant_name: string;
  amount: number;
  currency: string;
  transaction_date: Date;
  posted_date: Date;
  external_id: string | null;
  description: string | null;
  transaction_type: 'debit' | 'credit' | 'transfer';
  status: 'raw' | 'processing' | 'processed' | 'error';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Merchant {
  id: number;
  user_id: number;
  original_name: string;
  normalized_name: string;
  merchant_id_external: string | null;
  logo_url: string | null;
  website: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  parent_id: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface TransactionCategory {
  id: number;
  transaction_id: number;
  category_id: number;
  confidence: number;
  is_manual_override: boolean;
  created_at: Date;
}

export interface Subscription {
  id: number;
  user_id: number;
  merchant_id: number;
  name: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  next_occurrence_date: Date;
  last_transaction_date: Date | null;
  is_active: boolean;
  category_id: number | null;
  detected_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  month_year: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Insight {
  id: number;
  user_id: number;
  insight_type:
    | 'spending_increase'
    | 'spending_decrease'
    | 'top_category'
    | 'subscription_cost'
    | 'budget_exceeded'
    | 'budget_remaining'
    | 'merchant_spike'
    | 'category_trend';
  insight_text: string;
  metric_value: number | null;
  metric_name: string | null;
  category_id: number | null;
  period_start: Date;
  period_end: Date;
  confidence: number;
  created_at: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface TransactionImportRequest {
  transactions: {
    transaction_date: string; // ISO date
    posted_date: string;
    merchant_name: string;
    amount: number;
    description?: string;
    transaction_type: 'debit' | 'credit' | 'transfer';
    category_hint?: string;
    external_id?: string;
  }[];
  source?: string; // e.g., 'plaid', 'csv_upload', 'manual'
}

export interface TransactionImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: {
    row: number;
    error: string;
  }[];
}

export interface SummaryResponse {
  total_spend: number;
  monthly_spend: number;
  monthly_change_percent: number;
  budget_health_score: number;
  active_categories: number;
  total_categories: number;
  budget_adherence_percent: number;
  anomalies_detected: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  spend_amount: number;
  transaction_count: number;
  average_transaction: number;
  percentage_of_total: number;
  trend: number; // percent change vs previous period
  budget_limit?: number;
  budget_used_percent?: number;
}

export interface CategoriesResponse {
  categories: CategoryBreakdown[];
  period: {
    start: string;
    end: string;
  };
  total_spend: number;
}

export interface TrendPoint {
  date: string;
  amount: number;
  category?: string;
}

export interface TrendsResponse {
  daily_trends: TrendPoint[];
  monthly_trends: TrendPoint[];
  rolling_30_day_average: number;
  rolling_60_day_average: number;
  rolling_90_day_average: number;
}

export interface SubscriptionSummary {
  id: number;
  name: string;
  merchant_name: string;
  amount: number;
  frequency: string;
  next_charge_date: string;
  annual_cost: number;
  last_charged: string;
  is_active: boolean;
}

export interface SubscriptionsResponse {
  subscriptions: SubscriptionSummary[];
  total_monthly_cost: number;
  total_annual_cost: number;
  active_count: number;
}

export interface InsightItem {
  id: number;
  type: string;
  title: string;
  description: string;
  metric_value?: number;
  metric_label?: string;
  category?: string;
  confidence: number;
  action_text?: string;
  action_url?: string;
}

export interface InsightsResponse {
  insights: InsightItem[];
  generated_at: string;
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

export interface CategoryPerformance {
  category_id: number;
  category_name: string;
  monthly_spend: number;
  avg_transaction: number;
  transaction_count: number;
  score: number; // 0-100
  trend_percent: number;
  budget_status?: 'under' | 'on_track' | 'over';
  budget_remaining?: number;
}

export interface MerchantStats {
  merchant_id: number;
  merchant_name: string;
  total_spend: number;
  transaction_count: number;
  average_transaction: number;
  last_transaction_date: string;
  category?: string;
}

export interface BudgetAlert {
  category_id: number;
  category_name: string;
  budget_limit: number;
  current_spend: number;
  remaining: number;
  percent_used: number;
  status: 'safe' | 'warning' | 'exceeded';
  days_remaining: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateTransactionError extends Error {
  constructor(public external_id: string) {
    super(`Transaction with external_id ${external_id} already exists`);
    this.name = 'DuplicateTransactionError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}
