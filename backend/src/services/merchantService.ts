/**
 * Merchant Service - Normalize and deduplicate merchants
 * Uses fuzzy matching to find similar merchant names
 */

import db from '../db/connection';
import Levenshtein from 'levenshtein-distance';

// ============================================================================
// MERCHANT NORMALIZATION
// ============================================================================

/**
 * Find or create merchant with normalization
 * Uses fuzzy matching to detect duplicates
 */
export async function findOrCreateMerchant(
  userId: number,
  originalName: string,
): Promise<{ id: number; name: string; is_new: boolean }> {
  const normalized = normalizeMerchantName(originalName);

  // Try exact match first
  let merchant = await db('merchants')
    .where('user_id', userId)
    .where('normalized_name', normalized)
    .select('id', 'original_name', 'normalized_name')
    .first();

  if (merchant) {
    return { id: merchant.id, name: merchant.normalized_name, is_new: false };
  }

  // Try fuzzy match
  const fuzzyMatch = await findSimilarMerchant(userId, normalized, originalName);

  if (fuzzyMatch) {
    return { id: fuzzyMatch.id, name: fuzzyMatch.normalized_name, is_new: false };
  }

  // Create new merchant
  const newId = await db('merchants').insert({
    user_id: userId,
    original_name: originalName,
    normalized_name: normalized,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return { id: newId[0], name: normalized, is_new: true };
}

/**
 * Batch process merchants for transactions
 */
export async function processTransactionMerchants(
  userId: number,
  transactions: Array<{ id: number; original_merchant_name: string }>,
): Promise<{
  processed: number;
  new_merchants: number;
  duplicates_found: number;
  errors: Array<{ transaction_id: number; error: string }>;
}> {
  let processed = 0;
  let newMerchants = 0;
  let duplicatesFound = 0;
  const errors: Array<{ transaction_id: number; error: string }> = [];

  for (const txn of transactions) {
    try {
      const merchant = await findOrCreateMerchant(userId, txn.original_merchant_name);

      if (merchant.is_new) {
        newMerchants++;
      } else {
        duplicatesFound++;
      }

      // Update transaction with merchant_id
      await db('transactions').where('id', txn.id).update({
        merchant_id: merchant.id,
      });

      processed++;
    } catch (error) {
      errors.push({
        transaction_id: txn.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { processed, new_merchants: newMerchants, duplicates_found: duplicatesFound, errors };
}

// ============================================================================
// FUZZY MATCHING
// ============================================================================

/**
 * Find similar merchant using Levenshtein distance
 * Threshold: distance < 3 is considered a match
 */
async function findSimilarMerchant(
  userId: number,
  normalizedName: string,
  originalName: string,
): Promise<{ id: number; normalized_name: string } | null> {
  const DISTANCE_THRESHOLD = 3;
  const MAX_LENGTH_DIFF = 10;

  // Get all merchants for user
  const merchants = await db('merchants').where('user_id', userId).select('id', 'normalized_name');

  let bestMatch: { id: number; normalized_name: string } | null = null;
  let bestDistance = DISTANCE_THRESHOLD;

  for (const merchant of merchants) {
    // Quick length check (too different = not a match)
    if (Math.abs(normalizedName.length - merchant.normalized_name.length) > MAX_LENGTH_DIFF) {
      continue;
    }

    // Calculate Levenshtein distance
    const distance = Levenshtein(normalizedName, merchant.normalized_name);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = merchant;
    }
  }

  return bestMatch;
}

// ============================================================================
// NAME NORMALIZATION
// ============================================================================

/**
 * Normalize merchant name for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common suffixes
 * - Extract core name
 */
function normalizeMerchantName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove common suffixes
    .replace(/\s(store|supermarket|shop|cafe|restaurant|ltd|inc|plc|co\.?\s*ltd|gmbh)$/i, '')
    // Remove ordinal suffixes
    .replace(/\s+(online|app|mobile|digital)$/i, '')
    // Extract merchant name from long descriptors
    .split(' ')[0];

  // Special cases - common merchant name variations
  const specialCases: { [key: string]: string } = {
    'marks & spencer': 'marks & spencer',
    'm&s': 'marks & spencer',
    'tfl': 'tfl',
    'sainsburys': 'sainsbury',
    'waitrose': 'waitrose',
    'tesco': 'tesco',
    'asda': 'asda',
    'morrisons': 'morrisons',
    'iceland': 'iceland',
    'costa': 'costa',
    'starbucks': 'starbucks',
    'uber': 'uber',
    'lyft': 'lyft',
    'netflix': 'netflix',
    'spotify': 'spotify',
    'amazon': 'amazon',
    'boots': 'boots',
  };

  // Check special cases
  for (const [key, value] of Object.entries(specialCases)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return normalized;
}

// ============================================================================
// MERCHANT STATS
// ============================================================================

/**
 * Get top merchants by spend
 */
export async function getTopMerchants(
  userId: number,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
) {
  let query = db('transactions')
    .join('merchants', 'transactions.merchant_id', 'merchants.id')
    .where('transactions.user_id', userId)
    .where('merchants.user_id', userId);

  if (startDate) {
    query = query.where('transactions.transaction_date', '>=', startDate);
  }

  if (endDate) {
    query = query.where('transactions.transaction_date', '<=', endDate);
  }

  return query
    .groupBy('merchants.id', 'merchants.normalized_name')
    .select('merchants.id', 'merchants.normalized_name as name')
    .sum('transactions.amount as total_spend')
    .count('transactions.id as transaction_count')
    .avg('transactions.amount as avg_amount')
    .orderBy('total_spend', 'desc')
    .limit(limit);
}

/**
 * Get all merchants for user
 */
export async function getMerchants(userId: number) {
  return db('merchants')
    .where('user_id', userId)
    .orderBy('normalized_name', 'asc');
}

/**
 * Get merchant with transaction count and spend
 */
export async function getMerchantStats(userId: number, merchantId: number) {
  const stats = await db('transactions')
    .where('user_id', userId)
    .where('merchant_id', merchantId)
    .count('* as transaction_count')
    .sum('amount as total_spend')
    .avg('amount as avg_amount')
    .min('amount as min_amount')
    .max('amount as max_amount')
    .first();

  const merchant = await db('merchants').where('id', merchantId).select('normalized_name').first();

  return {
    merchant_id: merchantId,
    merchant_name: merchant?.normalized_name || 'Unknown',
    ...stats,
  };
}

// ============================================================================
// DEDUPLICATION UTILITIES
// ============================================================================

/**
 * Merge duplicate merchants
 * Updates all transactions from old_merchant_id to new_merchant_id
 */
export async function mergeMerchants(userId: number, newMerchantId: number, oldMerchantId: number) {
  // Update all transactions
  await db('transactions')
    .where('user_id', userId)
    .where('merchant_id', oldMerchantId)
    .update({ merchant_id: newMerchantId });

  // Delete old merchant
  await db('merchants').where('id', oldMerchantId).delete();
}

/**
 * Find potential duplicate merchants
 */
export async function findPotentialDuplicates(userId: number, threshold: number = 2) {
  const merchants = await db('merchants')
    .where('user_id', userId)
    .select('id', 'normalized_name')
    .orderBy('normalized_name');

  const duplicates: Array<{ merchant1: any; merchant2: any; distance: number }> = [];

  for (let i = 0; i < merchants.length; i++) {
    for (let j = i + 1; j < merchants.length; j++) {
      const distance = Levenshtein(merchants[i].normalized_name, merchants[j].normalized_name);

      if (distance <= threshold) {
        duplicates.push({
          merchant1: merchants[i],
          merchant2: merchants[j],
          distance,
        });
      }
    }
  }

  return duplicates;
}
