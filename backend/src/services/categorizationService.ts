/**
 * Categorization Service - Assign categories to transactions
 * Rule-based engine with confidence scoring
 */

import db from '../db/connection';

// ============================================================================
// CATEGORIZATION RULES
// ============================================================================

interface CategorizationRule {
  category_name: string;
  keywords: string[];
  confidence: number;
  priority: number; // Higher = check first
}

const CATEGORIZATION_RULES: CategorizationRule[] = [
  // Subscriptions - Highest confidence
  {
    category_name: 'Subscriptions',
    keywords: ['netflix', 'spotify', 'amazon prime', 'apple music', 'youtube premium', 'disney+', 'britbox'],
    confidence: 0.99,
    priority: 100,
  },
  {
    category_name: 'Subscriptions',
    keywords: ['microsoft 365', 'office 365', 'adobe', 'slack', 'notion', 'canva', 'figma'],
    confidence: 0.98,
    priority: 100,
  },

  // Utilities
  {
    category_name: 'Utilities',
    keywords: ['british gas', 'virgin media', 'vodafone', 'o2', 'ee', 'water', 'energy', 'electric'],
    confidence: 0.97,
    priority: 95,
  },

  // Transport
  {
    category_name: 'Transport',
    keywords: ['uber', 'lyft', 'tfl', 'transport for london', 'national rail', 'train', 'bus fare'],
    confidence: 0.95,
    priority: 90,
  },
  {
    category_name: 'Transport',
    keywords: ['petrol', 'fuel', 'shell', 'bp', 'esso', 'parking'],
    confidence: 0.88,
    priority: 85,
  },

  // Groceries
  {
    category_name: 'Groceries',
    keywords: [
      'tesco',
      'sainsbury',
      'waitrose',
      'asda',
      'ocado',
      'iceland',
      'marks & spencer',
      'morrisons',
      'lidl',
      'aldi',
    ],
    confidence: 0.96,
    priority: 90,
  },

  // Dining
  {
    category_name: 'Dining',
    keywords: ['costa', 'starbucks', 'caffe nero', 'pret', 'greggs', 'coffee'],
    confidence: 0.92,
    priority: 85,
  },
  {
    category_name: 'Dining',
    keywords: [
      'restaurant',
      'nando',
      'wagamama',
      'zizzi',
      'pizza express',
      'leon',
      'buffalo',
      'pizza hut',
      'mcdonalds',
    ],
    confidence: 0.91,
    priority: 85,
  },
  {
    category_name: 'Dining',
    keywords: ['uber eats', 'deliveroo', 'just eat', 'delivery'],
    confidence: 0.93,
    priority: 85,
  },

  // Shopping
  {
    category_name: 'Shopping',
    keywords: [
      'asos',
      'amazon',
      'ebay',
      'john lewis',
      'selfridges',
      'next',
      'gap',
      'h&m',
      'zara',
      'primark',
    ],
    confidence: 0.88,
    priority: 80,
  },

  // Healthcare
  {
    category_name: 'Healthcare',
    keywords: ['boots', 'pharmacy', 'gym', 'fitness', 'doctor', 'hospital', 'dental', 'optician'],
    confidence: 0.90,
    priority: 85,
  },

  // Entertainment
  {
    category_name: 'Entertainment',
    keywords: ['cinema', 'cineworld', 'odeon', 'game', 'gamespot', 'steam', 'playstation', 'xbox'],
    confidence: 0.87,
    priority: 80,
  },

  // Work/Business (if applicable)
  {
    category_name: 'Work',
    keywords: ['office', 'conference', 'travel express', 'uber business'],
    confidence: 0.85,
    priority: 75,
  },

  // Default - Uncategorized
  {
    category_name: 'Uncategorized',
    keywords: [],
    confidence: 0.0,
    priority: 0,
  },
];

// ============================================================================
// CATEGORIZATION
// ============================================================================

/**
 * Categorize a single transaction based on rules
 */
export async function categorizeTransaction(
  transactionId: number,
  merchantName: string,
): Promise<{ category_id: number; category_name: string; confidence: number }> {
  const normalized = merchantName.toLowerCase().trim();

  // Find matching rule
  const matchedRule = findMatchingRule(normalized);

  // Get category ID
  const category = await db('categories')
    .where('name', matchedRule.category_name)
    .select('id', 'name')
    .first();

  if (!category) {
    throw new Error(`Category '${matchedRule.category_name}' not found`);
  }

  // Assign category
  await db('transaction_categories').insert({
    transaction_id: transactionId,
    category_id: category.id,
    confidence: matchedRule.confidence,
    is_manual_override: false,
    created_at: new Date(),
  });

  return {
    category_id: category.id,
    category_name: category.name,
    confidence: matchedRule.confidence,
  };
}

/**
 * Batch categorize transactions
 */
export async function categorizeTransactionsBatch(
  transactions: Array<{ id: number; original_merchant_name: string }>,
): Promise<{
  categorized: number;
  failed: number;
  errors: Array<{ transaction_id: number; error: string }>;
}> {
  const errors: Array<{ transaction_id: number; error: string }> = [];
  let categorized = 0;
  let failed = 0;

  for (const txn of transactions) {
    try {
      await categorizeTransaction(txn.id, txn.original_merchant_name);
      categorized++;
    } catch (error) {
      failed++;
      errors.push({
        transaction_id: txn.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { categorized, failed, errors };
}

/**
 * Find matching categorization rule for merchant
 */
function findMatchingRule(merchantName: string): CategorizationRule {
  // Sort by priority (highest first)
  const sortedRules = [...CATEGORIZATION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.keywords.length === 0) {
      // Catch-all rule
      continue;
    }

    // Check if merchant contains any keyword
    if (rule.keywords.some((keyword) => merchantName.includes(keyword))) {
      return rule;
    }
  }

  // Return uncategorized rule
  return CATEGORIZATION_RULES.find((r) => r.category_name === 'Uncategorized') || CATEGORIZATION_RULES[0];
}

// ============================================================================
// MULTI-CATEGORY SUPPORT
// ============================================================================

/**
 * Assign multiple categories with confidence scores
 * Example: "Tesco Fuel" → Groceries (0.80) + Shopping (0.20)
 */
export async function categorizeTransactionMulti(
  transactionId: number,
  merchantName: string,
): Promise<Array<{ category_id: number; category_name: string; confidence: number }>> {
  const normalized = merchantName.toLowerCase().trim();

  // Find all matching rules
  const matchedRules = findMatchingRulesMulti(normalized);

  if (matchedRules.length === 0) {
    // Fallback to uncategorized
    matchedRules.push({
      category_name: 'Uncategorized',
      confidence: 0.5,
    });
  }

  // Normalize confidence scores to sum to 1.0
  const totalConfidence = matchedRules.reduce((sum, r) => sum + r.confidence, 0);
  const normalizedRules = matchedRules.map((r) => ({
    ...r,
    confidence: r.confidence / totalConfidence,
  }));

  // Assign categories
  const results = [];
  for (const rule of normalizedRules) {
    const category = await db('categories')
      .where('name', rule.category_name)
      .select('id', 'name')
      .first();

    if (category) {
      await db('transaction_categories').insert({
        transaction_id: transactionId,
        category_id: category.id,
        confidence: Math.round(rule.confidence * 100) / 100, // 2 decimals
        is_manual_override: false,
        created_at: new Date(),
      });

      results.push({
        category_id: category.id,
        category_name: category.name,
        confidence: rule.confidence,
      });
    }
  }

  return results;
}

/**
 * Find all matching rules for multi-category support
 */
function findMatchingRulesMulti(
  merchantName: string,
): Array<{ category_name: string; confidence: number }> {
  const matches: Map<string, number> = new Map();

  for (const rule of CATEGORIZATION_RULES) {
    if (rule.keywords.length === 0) continue;

    // Check if any keyword matches
    for (const keyword of rule.keywords) {
      if (merchantName.includes(keyword)) {
        const existing = matches.get(rule.category_name) || 0;
        matches.set(rule.category_name, Math.max(existing, rule.confidence));
        break;
      }
    }
  }

  // Convert map to array
  return Array.from(matches.entries()).map(([category_name, confidence]) => ({
    category_name,
    confidence,
  }));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get categorization statistics
 */
export async function getCategorizationStats(userId: number) {
  const stats = await db('transaction_categories')
    .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
    .join('categories', 'transaction_categories.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .groupBy('categories.name')
    .select('categories.name as category_name')
    .count('* as count')
    .sum('transactions.amount as total_amount')
    .avg('transactions.amount as avg_amount');

  return stats;
}

/**
 * Get uncategorized transaction count
 */
export async function getUncategorizedCount(userId: number): Promise<number> {
  const result = await db('transactions')
    .where('user_id', userId)
    .whereNotIn('id', db('transaction_categories').select('transaction_id'))
    .count('* as count')
    .first();

  return result?.count || 0;
}
