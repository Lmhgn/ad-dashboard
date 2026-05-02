/**
 * Analytics Service - Compute spending metrics and trends
 * Queries processed transactions and generates aggregated data
 */

import db from '../db/connection';

// ============================================================================
// TYPES
// ============================================================================

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

export interface TrendMetrics {
  rolling_30_day_avg: number;
  rolling_60_day_avg: number;
  rolling_90_day_avg: number;
  current_month_spend: number;
  previous_month_spend: number;
  mom_change_percent: number;
  mom_change_amount: number;
}

export interface CategoryBudgetStatus {
  category_id: number;
  category_name: string;
  budget_limit: number;
  spent_this_month: number;
  remaining: number;
  used_percent: number;
  status: 'safe' | 'warning' | 'exceeded';
}

// ============================================================================
// DAILY ANALYTICS
// ============================================================================

/**
 * Get daily spending summary for a date
 */
export async function getDailySummary(userId: number, date: string): Promise<DailySummary> {
  // Get total for day
  const dayTotal = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', date)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .count('* as count')
    .avg('amount as avg')
    .first();

  // Get by category
  const byCategory = await db('transactions')
    .join('transaction_categories', 'transactions.id', 'transaction_categories.transaction_id')
    .join('categories', 'transaction_categories.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .where('transactions.transaction_date', date)
    .where('transactions.status', 'processed')
    .where('transactions.transaction_type', 'debit')
    .groupBy('categories.id', 'categories.name')
    .select('categories.id as category_id', 'categories.name as category_name')
    .sum('transactions.amount as amount')
    .count('transactions.id as count');

  return {
    date,
    total_spend: parseFloat(dayTotal?.total || '0'),
    transaction_count: dayTotal?.count || 0,
    avg_transaction: parseFloat(dayTotal?.avg || '0'),
    categories: byCategory.map((c: any) => ({
      category_id: c.category_id,
      category_name: c.category_name,
      amount: parseFloat(c.amount || '0'),
      count: c.count || 0,
    })),
  };
}

/**
 * Get daily summaries for date range
 */
export async function getDailySummaries(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<DailySummary[]> {
  const summaries: DailySummary[] = [];

  // Generate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const summary = await getDailySummary(userId, dateStr);
    if (summary.transaction_count > 0) {
      summaries.push(summary);
    }
  }

  return summaries;
}

// ============================================================================
// MONTHLY ANALYTICS
// ============================================================================

/**
 * Get monthly spending summary
 */
export async function getMonthlySummary(userId: number, yearMonth: string): Promise<MonthlySummary> {
  // Parse year-month (YYYY-MM)
  const [year, month] = yearMonth.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0)
    .toISOString()
    .split('T')[0];

  // Total for month
  const monthTotal = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', startDate)
    .where('transaction_date', '<=', endDate)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .count('* as count')
    .avg('amount as avg')
    .first();

  const totalSpend = parseFloat(monthTotal?.total || '0');

  // By category
  const byCategory = await db('transactions')
    .join('transaction_categories', 'transactions.id', 'transaction_categories.transaction_id')
    .join('categories', 'transaction_categories.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .where('transactions.transaction_date', '>=', startDate)
    .where('transactions.transaction_date', '<=', endDate)
    .where('transactions.status', 'processed')
    .where('transactions.transaction_type', 'debit')
    .groupBy('categories.id', 'categories.name')
    .select('categories.id as category_id', 'categories.name as category_name')
    .sum('transactions.amount as amount')
    .count('transactions.id as count');

  return {
    month: yearMonth,
    total_spend: totalSpend,
    transaction_count: monthTotal?.count || 0,
    avg_transaction: parseFloat(monthTotal?.avg || '0'),
    categories: byCategory.map((c: any) => ({
      category_id: c.category_id,
      category_name: c.category_name,
      amount: parseFloat(c.amount || '0'),
      percentage: totalSpend > 0 ? (parseFloat(c.amount || '0') / totalSpend) * 100 : 0,
      count: c.count || 0,
    })),
  };
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Calculate rolling averages and MoM changes
 */
export async function getTrendMetrics(userId: number): Promise<TrendMetrics> {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Rolling averages
  const rolling30 = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', thirtyDaysAgo)
    .where('transaction_date', '<=', today)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .avg('amount as avg')
    .first();

  const rolling60 = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', sixtyDaysAgo)
    .where('transaction_date', '<=', today)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .avg('amount as avg')
    .first();

  const rolling90 = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', ninetyDaysAgo)
    .where('transaction_date', '<=', today)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .avg('amount as avg')
    .first();

  // Current month
  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentMonthEnd = today;

  const currentMonth = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', currentMonthStart)
    .where('transaction_date', '<=', currentMonthEnd)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .first();

  // Previous month
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevMonthStart = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonthEnd = prevMonthDate.toISOString().split('T')[0];

  const previousMonth = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', prevMonthStart)
    .where('transaction_date', '<=', prevMonthEnd)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .first();

  const currentMonthSpend = parseFloat(currentMonth?.total || '0');
  const previousMonthSpend = parseFloat(previousMonth?.total || '0');
  const momChange = previousMonthSpend > 0 ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100 : 0;

  return {
    rolling_30_day_avg: parseFloat(rolling30?.avg || '0'),
    rolling_60_day_avg: parseFloat(rolling60?.avg || '0'),
    rolling_90_day_avg: parseFloat(rolling90?.avg || '0'),
    current_month_spend: currentMonthSpend,
    previous_month_spend: previousMonthSpend,
    mom_change_percent: Math.round(momChange * 100) / 100,
    mom_change_amount: Math.round((currentMonthSpend - previousMonthSpend) * 100) / 100,
  };
}

// ============================================================================
// BUDGET ANALYSIS
// ============================================================================

/**
 * Get budget status for all categories
 */
export async function getBudgetStatus(userId: number, month?: string): Promise<CategoryBudgetStatus[]> {
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, monthNum] = targetMonth.split('-');
  const monthStart = `${year}-${monthNum}-01`;
  const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0)
    .toISOString()
    .split('T')[0];

  // Get all budgets for month
  const budgets = await db('budgets')
    .where('user_id', userId)
    .where(
      db.raw(`DATE_TRUNC('month', month_year)::date = ?`, [monthStart]),
    )
    .select('category_id', 'amount as budget_limit');

  const results: CategoryBudgetStatus[] = [];

  for (const budget of budgets) {
    // Get category info
    const category = await db('categories')
      .where('id', budget.category_id)
      .select('id', 'name')
      .first();

    if (!category) continue;

    // Get spending for category this month
    const spending = await db('transactions')
      .join('transaction_categories', 'transactions.id', 'transaction_categories.transaction_id')
      .where('transactions.user_id', userId)
      .where('transaction_categories.category_id', budget.category_id)
      .where('transactions.transaction_date', '>=', monthStart)
      .where('transactions.transaction_date', '<=', monthEnd)
      .where('transactions.status', 'processed')
      .where('transactions.transaction_type', 'debit')
      .sum('transactions.amount as total')
      .first();

    const spent = parseFloat(spending?.total || '0');
    const remaining = budget.budget_limit - spent;
    const usedPercent = (spent / budget.budget_limit) * 100;

    let status: 'safe' | 'warning' | 'exceeded';
    if (usedPercent > 100) {
      status = 'exceeded';
    } else if (usedPercent > 80) {
      status = 'warning';
    } else {
      status = 'safe';
    }

    results.push({
      category_id: budget.category_id,
      category_name: category.name,
      budget_limit: budget.budget_limit,
      spent_this_month: spent,
      remaining: Math.max(remaining, 0),
      used_percent: Math.round(usedPercent * 100) / 100,
      status,
    });
  }

  return results;
}

// ============================================================================
// CATEGORY PERFORMANCE
// ============================================================================

/**
 * Get top categories by spend
 */
export async function getTopCategories(userId: number, limit: number = 10, startDate?: string, endDate?: string) {
  let query = db('transactions')
    .join('transaction_categories', 'transactions.id', 'transaction_categories.transaction_id')
    .join('categories', 'transaction_categories.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .where('transactions.status', 'processed')
    .where('transactions.transaction_type', 'debit');

  if (startDate) {
    query = query.where('transactions.transaction_date', '>=', startDate);
  }

  if (endDate) {
    query = query.where('transactions.transaction_date', '<=', endDate);
  }

  return query
    .groupBy('categories.id', 'categories.name')
    .select('categories.id as category_id', 'categories.name')
    .sum('transactions.amount as total_spend')
    .count('transactions.id as transaction_count')
    .avg('transactions.amount as avg_amount')
    .orderBy('total_spend', 'desc')
    .limit(limit);
}

/**
 * Calculate category performance score (0-100)
 * Higher score = better (within budget, trending down)
 */
export async function getCategoryPerformanceScore(
  userId: number,
  categoryId: number,
): Promise<number> {
  const budget = await db('budgets')
    .where('user_id', userId)
    .where('category_id', categoryId)
    .select('amount')
    .first();

  if (!budget) return 50; // No budget set = neutral score

  // Get month spend
  const monthStatus = await getBudgetStatus(userId);
  const categoryStatus = monthStatus.find((c) => c.category_id === categoryId);

  if (!categoryStatus) return 50;

  // Score calculation
  // 100 = at budget limit
  // 50 = 50% of budget used
  // 0 = over budget
  let score = Math.max(0, 100 - (categoryStatus.used_percent - 100));
  if (score > 100) {
    score = Math.min(100, categoryStatus.used_percent / 2);
  }

  return Math.round(score);
}

// ============================================================================
// SUMMARY QUERIES
// ============================================================================

/**
 * Get complete spending summary for user
 */
export async function getCompleteSummary(userId: number) {
  const trends = await getTrendMetrics(userId);
  const topCategories = await getTopCategories(userId, 5);
  const budgetStatus = await getBudgetStatus(userId);

  // Calculate total spend (lifetime)
  const lifetime = await db('transactions')
    .where('user_id', userId)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .count('* as count')
    .first();

  return {
    total_spend_lifetime: parseFloat(lifetime?.total || '0'),
    transaction_count: lifetime?.count || 0,
    trends,
    top_categories: topCategories,
    budget_status: budgetStatus,
  };
}
