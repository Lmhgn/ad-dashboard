/**
 * Subscription Service - Detect recurring transactions
 * Identifies subscriptions and creates subscription records
 */

import db from '../db/connection';

// ============================================================================
// SUBSCRIPTION DETECTION
// ============================================================================

interface RecurringPattern {
  merchant_id: number;
  merchant_name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  transaction_count: number;
  variance_percent: number;
  first_date: string;
  last_date: string;
  next_occurrence_date: string;
  category_id?: number;
}

/**
 * Detect subscriptions for a user
 * Looks for recurring transactions in the last 90 days
 */
export async function detectSubscriptions(userId: number): Promise<{
  detected: number;
  created: number;
  errors: Array<{ error: string }>;
}> {
  let created = 0;
  let detected = 0;
  const errors: Array<{ error: string }> = [];

  try {
    // Find all merchants with multiple transactions
    const merchants = await db('transactions')
      .where('transactions.user_id', userId)
      .where('transactions.status', 'processed')
      .whereNotNull('merchant_id')
      .groupBy('merchant_id')
      .having(db.raw('count(*) >= 3')) // At least 3 transactions
      .select('merchant_id')
      .count('* as count');

    for (const merchant of merchants) {
      try {
        const pattern = await analyzeRecurringPattern(userId, merchant.merchant_id);

        if (pattern && isLikelySubscription(pattern)) {
          const subscriptionId = await createSubscription(userId, pattern);
          if (subscriptionId) {
            created++;
          }
        }

        detected++;
      } catch (error) {
        errors.push({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    errors.push({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return { detected, created, errors };
}

/**
 * Analyze recurring pattern for a merchant
 */
async function analyzeRecurringPattern(
  userId: number,
  merchantId: number,
): Promise<RecurringPattern | null> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get all transactions for merchant in last 90 days
  const transactions = await db('transactions')
    .where('user_id', userId)
    .where('merchant_id', merchantId)
    .where('transaction_date', '>=', ninetyDaysAgo.toISOString().split('T')[0])
    .orderBy('transaction_date', 'asc')
    .select('transaction_date', 'amount');

  if (transactions.length < 3) {
    return null;
  }

  // Get merchant info
  const merchant = await db('merchants').where('id', merchantId).select('normalized_name').first();

  if (!merchant) {
    return null;
  }

  // Get category (most common category for this merchant)
  const category = await db('transaction_categories')
    .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
    .where('transactions.merchant_id', merchantId)
    .groupBy('transaction_categories.category_id')
    .select('transaction_categories.category_id')
    .count('* as count')
    .orderBy('count', 'desc')
    .first();

  // Analyze amounts
  const amounts = transactions.map((t) => t.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = Math.max(...amounts) - Math.min(...amounts);
  const variancePercent = (variance / avgAmount) * 100;

  // Detect frequency
  const frequency = detectFrequency(transactions.map((t) => new Date(t.transaction_date)));

  if (!frequency) {
    return null;
  }

  // Calculate next occurrence
  const lastDate = new Date(transactions[transactions.length - 1].transaction_date);
  const nextOccurrenceDate = calculateNextOccurrence(lastDate, frequency);

  return {
    merchant_id: merchantId,
    merchant_name: merchant.normalized_name,
    amount: Math.round(avgAmount * 100) / 100,
    frequency,
    transaction_count: transactions.length,
    variance_percent: Math.round(variancePercent * 100) / 100,
    first_date: transactions[0].transaction_date,
    last_date: transactions[transactions.length - 1].transaction_date,
    next_occurrence_date: nextOccurrenceDate.toISOString().split('T')[0],
    category_id: category?.category_id,
  };
}

/**
 * Detect transaction frequency
 */
function detectFrequency(dates: Date[]): 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | null {
  if (dates.length < 2) return null;

  // Calculate differences between consecutive dates (in days)
  const dayDiffs: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    dayDiffs.push(diff);
  }

  // Average difference
  const avgDiff = dayDiffs.reduce((a, b) => a + b, 0) / dayDiffs.length;
  const maxDeviation = Math.max(...dayDiffs.map((d) => Math.abs(d - avgDiff)));

  // Tolerance (transactions vary slightly by a few days)
  const tolerance = 3;

  if (avgDiff <= 1) return 'daily';
  if (avgDiff >= 5 && avgDiff <= 10 && maxDeviation <= tolerance) return 'weekly';
  if (avgDiff >= 12 && avgDiff <= 16 && maxDeviation <= tolerance) return 'biweekly';
  if (avgDiff >= 25 && avgDiff <= 35 && maxDeviation <= tolerance) return 'monthly';
  if (avgDiff >= 80 && avgDiff <= 95 && maxDeviation <= tolerance) return 'quarterly';
  if (avgDiff >= 350 && avgDiff <= 370 && maxDeviation <= tolerance) return 'annual';

  return null;
}

/**
 * Check if pattern looks like a real subscription
 */
function isLikelySubscription(pattern: RecurringPattern): boolean {
  // Must have at least 2 transactions
  if (pattern.transaction_count < 2) {
    return false;
  }

  // Amount variance should be < 20% (subscriptions are consistent)
  if (pattern.variance_percent > 20) {
    return false;
  }

  // Must be monthly or less frequent (daily/weekly/etc are less likely subscriptions)
  const frequencyWeights = {
    daily: false, // Too frequent to be typical subscriptions
    weekly: true, // Could be weekly subscriptions
    biweekly: true,
    monthly: true,
    quarterly: true,
    annual: true,
  };

  return frequencyWeights[pattern.frequency];
}

/**
 * Calculate next occurrence date
 */
function calculateNextOccurrence(lastDate: Date, frequency: string): Date {
  const next = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

/**
 * Create subscription record
 */
async function createSubscription(userId: number, pattern: RecurringPattern): Promise<number | null> {
  try {
    // Check if subscription already exists
    const existing = await db('subscriptions')
      .where('user_id', userId)
      .where('merchant_id', pattern.merchant_id)
      .first();

    if (existing) {
      // Update existing
      await db('subscriptions')
        .where('user_id', userId)
        .where('merchant_id', pattern.merchant_id)
        .update({
          amount: pattern.amount,
          frequency: pattern.frequency,
          next_occurrence_date: pattern.next_occurrence_date,
          last_transaction_date: pattern.last_date,
          updated_at: new Date(),
        });

      return null; // Not "new" but updated
    }

    // Create new subscription
    const subscriptionId = await db('subscriptions').insert({
      user_id: userId,
      merchant_id: pattern.merchant_id,
      name: pattern.merchant_name,
      amount: pattern.amount,
      currency: 'GBP',
      frequency: pattern.frequency,
      next_occurrence_date: pattern.next_occurrence_date,
      last_transaction_date: pattern.last_date,
      is_active: true,
      category_id: pattern.category_id || null,
      detected_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return subscriptionId[0];
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }
}

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Get subscriptions for user
 */
export async function getSubscriptions(userId: number, activeOnly: boolean = true) {
  let query = db('subscriptions').where('user_id', userId);

  if (activeOnly) {
    query = query.where('is_active', true);
  }

  return query
    .join('merchants', 'subscriptions.merchant_id', 'merchants.id')
    .select('subscriptions.*', 'merchants.normalized_name as merchant_name')
    .orderBy('subscriptions.amount', 'desc');
}

/**
 * Get subscription summary
 */
export async function getSubscriptionSummary(userId: number) {
  const subscriptions = await getSubscriptions(userId, true);

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const monthlyAmount = calculateMonthlyAmount(s.amount, s.frequency);
    return sum + monthlyAmount;
  }, 0);

  const totalAnnual = subscriptions.reduce((sum, s) => {
    const annualAmount = calculateAnnualAmount(s.amount, s.frequency);
    return sum + annualAmount;
  }, 0);

  return {
    total_subscriptions: subscriptions.length,
    total_monthly_cost: Math.round(totalMonthly * 100) / 100,
    total_annual_cost: Math.round(totalAnnual * 100) / 100,
    subscriptions,
  };
}

/**
 * Calculate monthly cost from amount + frequency
 */
function calculateMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4.33;
    case 'biweekly':
      return amount * 2.17;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'annual':
      return amount / 12;
    default:
      return 0;
  }
}

/**
 * Calculate annual cost from amount + frequency
 */
function calculateAnnualAmount(amount: number, frequency: string): number {
  return calculateMonthlyAmount(amount, frequency) * 12;
}

/**
 * Toggle subscription active status
 */
export async function toggleSubscription(userId: number, subscriptionId: number): Promise<void> {
  const sub = await db('subscriptions')
    .where('id', subscriptionId)
    .where('user_id', userId)
    .select('is_active')
    .first();

  if (!sub) {
    throw new Error('Subscription not found');
  }

  await db('subscriptions')
    .where('id', subscriptionId)
    .where('user_id', userId)
    .update({
      is_active: !sub.is_active,
      updated_at: new Date(),
    });
}
