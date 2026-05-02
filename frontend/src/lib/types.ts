/**
 * Frontend TypeScript type definitions
 */

// ============================================================================
// TRANSACTIONS
// ============================================================================

export interface Transaction {
  id: number;
  user_id: number;
  merchant_id: number | null;
  original_merchant_name: string;
  amount: number;
  currency: string;
  transaction_date: string;
  posted_date: string;
  external_id: string | null;
  description: string | null;
  transaction_type: 'debit' | 'credit' | 'transfer';
  status: 'raw' | 'processing' | 'processed' | 'error';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface TrendMetrics {
  rolling_30_day_avg: number;
  rolling_60_day_avg: number;
  rolling_90_day_avg: number;
  current_month_spend: number;
  previous_month_spend: number;
  mom_change_percent: number;
  mom_change_amount: number;
}

export interface CategoryBreakdown {
  category_id: number;
  name: string;
  total_spend: number;
  transaction_count: number;
  avg_amount: number;
}

export interface BudgetStatus {
  category_id: number;
  category_name: string;
  budget_limit: number;
  spent_this_month: number;
  remaining: number;
  used_percent: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface Summary {
  total_spend_lifetime: number;
  transaction_count: number;
  trends: TrendMetrics;
  top_categories: CategoryBreakdown[];
  budget_status: BudgetStatus[];
}

export interface DailySummary {
  date: string;
  total_spend: number;
  transaction_count: number;
  avg_transaction: number;
  categories: Array<{
    category_id: number;
    category_name: string;
    amount: number;
    count: number;
  }>;
}

export interface MonthlySummary {
  month: string;
  total_spend: number;
  transaction_count: number;
  avg_transaction: number;
  categories: Array<{
    category_id: number;
    category_name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
}

// ============================================================================
// INSIGHTS
// ============================================================================

export type InsightType =
  | 'spending_increase'
  | 'spending_decrease'
  | 'top_category'
  | 'subscription_cost'
  | 'budget_exceeded'
  | 'budget_remaining'
  | 'merchant_spike'
  | 'category_trend';

export interface Insight {
  id: number;
  insight_type: InsightType;
  insight_text: string;
  metric_value: number | null;
  metric_name: string | null;
  category_id: number | null;
  confidence: number;
  created_at: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface Filters {
  dateRange: DateRange;
  selectedCategory?: number;
  viewType: 'monthly' | 'daily';
}

// ============================================================================
// LOADING STATES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}
