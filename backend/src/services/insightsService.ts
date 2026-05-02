/**
 * Insights Service - Generate actionable spending insights
 * Creates recommendations based on transaction data and trends
 */

import db from '../db/connection';
import * as analyticsService from './analyticsService';
import * as subscriptionService from './subscriptionService';
import * as merchantService from './merchantService';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedInsight {
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
  period_start: string;
  period_end: string;
  confidence: number;
}

// ============================================================================
// MAIN INSIGHT GENERATION
// ============================================================================

/**
 * Generate all insights for a user
 * Called nightly to update insights table
 */
export async function generateInsights(userId: number): Promise<{
  generated: number;
  errors: Array<{ error: string }>;
}> {
  const insights: GeneratedInsight[] = [];
  const errors: Array<{ error: string }> = [];

  try {
    // Get date range
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthStart = startOfMonth.toISOString().split('T')[0];

    try {
      insights.push(...(await generateSpendingChangeInsights(userId, monthStart, today)));
    } catch (e) {
      errors.push({ error: `Spending change insights failed: ${e}` });
    }

    try {
      insights.push(...(await generateTopCategoryInsights(userId, monthStart, today)));
    } catch (e) {
      errors.push({ error: `Top category insights failed: ${e}` });
    }

    try {
      insights.push(...(await generateSubscriptionInsights(userId, monthStart, today)));
    } catch (e) {
      errors.push({ error: `Subscription insights failed: ${e}` });
    }

    try {
      insights.push(...(await generateBudgetInsights(userId, monthStart, today)));
    } catch (e) {
      errors.push({ error: `Budget insights failed: ${e}` });
    }

    try {
      insights.push(...(await generateMerchantSpikeInsights(userId, thirtyDaysAgo, today)));
    } catch (e) {
      errors.push({ error: `Merchant spike insights failed: ${e}` });
    }

    try {
      insights.push(...(await generateCategoryTrendInsights(userId, thirtyDaysAgo, today)));
    } catch (e) {
      errors.push({ error: `Category trend insights failed: ${e}` });
    }

    // Store insights in database
    for (const insight of insights) {
      try {
        await db('insights').insert({
          user_id: userId,
          insight_type: insight.insight_type,
          insight_text: insight.insight_text,
          metric_value: insight.metric_value,
          metric_name: insight.metric_name,
          category_id: insight.category_id,
          period_start: insight.period_start,
          period_end: insight.period_end,
          confidence: insight.confidence,
          created_at: new Date(),
        });
      } catch (e) {
        errors.push({ error: `Failed to store insight: ${e}` });
      }
    }

    return { generated: insights.length, errors };
  } catch (error) {
    errors.push({ error: error instanceof Error ? error.message : 'Unknown error' });
    return { generated: 0, errors };
  }
}

// ============================================================================
// SPENDING CHANGE INSIGHTS
// ============================================================================

async function generateSpendingChangeInsights(
  userId: number,
  monthStart: string,
  monthEnd: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];
  const trends = await analyticsService.getTrendMetrics(userId);

  const currentSpend = trends.current_month_spend;
  const previousSpend = trends.previous_month_spend;
  const change = trends.mom_change_percent;
  const changeAmount = trends.mom_change_amount;

  if (previousSpend === 0) return insights;

  if (change > 10) {
    // Spending increased significantly
    insights.push({
      insight_type: 'spending_increase',
      insight_text: `Your spending increased by ${Math.round(change)}% this month (£${currentSpend.toFixed(2)} vs £${previousSpend.toFixed(2)})`,
      metric_value: changeAmount,
      metric_name: 'amount_increase',
      category_id: null,
      period_start: monthStart,
      period_end: monthEnd,
      confidence: 0.95,
    });
  } else if (change < -10) {
    // Spending decreased significantly
    insights.push({
      insight_type: 'spending_decrease',
      insight_text: `You spent ${Math.round(Math.abs(change))}% less this month (£${currentSpend.toFixed(2)} vs £${previousSpend.toFixed(2)})`,
      metric_value: Math.abs(changeAmount),
      metric_name: 'amount_decrease',
      category_id: null,
      period_start: monthStart,
      period_end: monthEnd,
      confidence: 0.95,
    });
  }

  return insights;
}

// ============================================================================
// TOP CATEGORY INSIGHTS
// ============================================================================

async function generateTopCategoryInsights(
  userId: number,
  monthStart: string,
  monthEnd: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];
  const topCategories = await analyticsService.getTopCategories(userId, 1, monthStart, monthEnd);

  if (topCategories.length === 0) return insights;

  const top = topCategories[0];
  const total = await db('transactions')
    .where('user_id', userId)
    .where('transaction_date', '>=', monthStart)
    .where('transaction_date', '<=', monthEnd)
    .where('status', 'processed')
    .where('transaction_type', 'debit')
    .sum('amount as total')
    .first();

  const totalSpend = parseFloat(total?.total || '0');
  const percentage = ((top.total_spend / totalSpend) * 100).toFixed(0);

  insights.push({
    insight_type: 'top_category',
    insight_text: `Your top spending category this month is ${top.name} (£${top.total_spend.toFixed(2)}, ${percentage}%)`,
    metric_value: parseFloat(top.total_spend),
    metric_name: 'category_spend',
    category_id: top.category_id,
    period_start: monthStart,
    period_end: monthEnd,
    confidence: 0.99,
  });

  return insights;
}

// ============================================================================
// SUBSCRIPTION INSIGHTS
// ============================================================================

async function generateSubscriptionInsights(
  userId: number,
  monthStart: string,
  monthEnd: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];
  const summary = await subscriptionService.getSubscriptionSummary(userId);

  if (summary.total_subscriptions > 0) {
    insights.push({
      insight_type: 'subscription_cost',
      insight_text: `You have ${summary.total_subscriptions} active subscriptions costing £${summary.total_monthly_cost.toFixed(2)}/month (£${summary.total_annual_cost.toFixed(2)}/year)`,
      metric_value: summary.total_monthly_cost,
      metric_name: 'monthly_subscriptions',
      category_id: null,
      period_start: monthStart,
      period_end: monthEnd,
      confidence: 0.98,
    });
  }

  return insights;
}

// ============================================================================
// BUDGET INSIGHTS
// ============================================================================

async function generateBudgetInsights(
  userId: number,
  monthStart: string,
  monthEnd: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];
  const budgetStatus = await analyticsService.getBudgetStatus(userId);

  for (const budget of budgetStatus) {
    if (budget.status === 'exceeded') {
      insights.push({
        insight_type: 'budget_exceeded',
        insight_text: `Your ${budget.category_name} budget exceeded by £${budget.spent_this_month - budget.budget_limit} (spent £${budget.spent_this_month.toFixed(2)} of £${budget.budget_limit.toFixed(2)})`,
        metric_value: budget.spent_this_month - budget.budget_limit,
        metric_name: 'overspend',
        category_id: budget.category_id,
        period_start: monthStart,
        period_end: monthEnd,
        confidence: 0.99,
      });
    } else if (budget.status === 'safe' && budget.remaining > budget.budget_limit * 0.15) {
      insights.push({
        insight_type: 'budget_remaining',
        insight_text: `You have £${budget.remaining.toFixed(2)} remaining in your ${budget.category_name} budget`,
        metric_value: budget.remaining,
        metric_name: 'remaining_budget',
        category_id: budget.category_id,
        period_start: monthStart,
        period_end: monthEnd,
        confidence: 0.90,
      });
    }
  }

  return insights;
}

// ============================================================================
// MERCHANT SPIKE INSIGHTS
// ============================================================================

async function generateMerchantSpikeInsights(
  userId: number,
  thirtyDaysAgo: string,
  today: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];

  // Get top merchants last 30 days
  const topMerchants = await merchantService.getTopMerchants(userId, 3, thirtyDaysAgo, today);

  // Get previous 30 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const prevMerchants = await merchantService.getTopMerchants(userId, 3, sixtyDaysAgo, thirtyDaysAgo);

  // Compare spending
  for (const current of topMerchants) {
    const previous = prevMerchants.find((m: any) => m.id === current.id);

    if (previous) {
      const increase = ((current.total_spend - previous.total_spend) / previous.total_spend) * 100;

      if (increase > 30) {
        insights.push({
          insight_type: 'merchant_spike',
          insight_text: `${current.name} spending increased ${Math.round(increase)}% (£${current.total_spend.toFixed(2)} vs £${previous.total_spend.toFixed(2)})`,
          metric_value: increase,
          metric_name: 'spending_increase_percent',
          category_id: null,
          period_start: thirtyDaysAgo,
          period_end: today,
          confidence: 0.85,
        });
      }
    }
  }

  return insights;
}

// ============================================================================
// CATEGORY TREND INSIGHTS
// ============================================================================

async function generateCategoryTrendInsights(
  userId: number,
  thirtyDaysAgo: string,
  today: string,
): Promise<GeneratedInsight[]> {
  const insights: GeneratedInsight[] = [];

  // Get top categories
  const categories = await analyticsService.getTopCategories(userId, 3, thirtyDaysAgo, today);

  for (const category of categories) {
    // Get previous 30 days
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const prev = await db('transactions')
      .join('transaction_categories', 'transactions.id', 'transaction_categories.transaction_id')
      .where('transactions.user_id', userId)
      .where('transaction_categories.category_id', category.category_id)
      .where('transactions.transaction_date', '>=', sixtyDaysAgo)
      .where('transactions.transaction_date', '<', thirtyDaysAgo)
      .where('transactions.status', 'processed')
      .where('transactions.transaction_type', 'debit')
      .sum('transactions.amount as total')
      .first();

    const prevSpend = parseFloat(prev?.total || '0');

    if (prevSpend > 0) {
      const trend = ((category.total_spend - prevSpend) / prevSpend) * 100;

      if (Math.abs(trend) > 20) {
        const direction = trend > 0 ? 'trending up' : 'trending down';
        const change = Math.abs(Math.round(trend));

        insights.push({
          insight_type: 'category_trend',
          insight_text: `Your ${category.name} spending is ${direction} (${change}% change in last 30 days)`,
          metric_value: trend,
          metric_name: 'trend_percent',
          category_id: category.category_id,
          period_start: thirtyDaysAgo,
          period_end: today,
          confidence: 0.80,
        });
      }
    }
  }

  return insights;
}

// ============================================================================
// INSIGHT RETRIEVAL
// ============================================================================

/**
 * Get recent insights for user
 */
export async function getRecentInsights(userId: number, limit: number = 10) {
  return db('insights')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .select(
      'id',
      'insight_type',
      'insight_text',
      'metric_value',
      'metric_name',
      'category_id',
      'confidence',
      'created_at',
    );
}

/**
 * Get insights by type
 */
export async function getInsightsByType(userId: number, type: string) {
  return db('insights')
    .where('user_id', userId)
    .where('insight_type', type)
    .orderBy('created_at', 'desc')
    .select(
      'id',
      'insight_type',
      'insight_text',
      'metric_value',
      'metric_name',
      'category_id',
      'confidence',
      'created_at',
    );
}
