/**
 * Transaction Service - Core business logic for transactions
 * Handles ingestion, validation, and idempotent processing
 */

import db from '../db/connection';
import { Transaction, TransactionImportRequest } from '../types';
import { TransactionInputSchema } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================================================
// IMPORT AND INGESTION
// ============================================================================

/**
 * Import transactions with idempotent duplicate detection
 * Returns summary of imported/skipped transactions
 */
export async function importTransactions(
  userId: number,
  importData: TransactionImportRequest,
  source: string = 'api',
): Promise<{
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  batch_id: string;
}> {
  const batchId = uuidv4();
  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;
  let skipped = 0;

  const transactions = importData.transactions;

  // Validate all transactions first
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    try {
      TransactionInputSchema.parse(txn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          row: i + 1,
          error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        });
      }
      continue;
    }

    // Process each valid transaction
    try {
      const wasInserted = await insertTransactionIdempotent(userId, txn, source, batchId);
      if (wasInserted) {
        imported++;
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { imported, skipped, errors, batch_id: batchId };
}

/**
 * Insert transaction with idempotent check
 * Uses external_id to detect duplicates
 * Returns true if inserted, false if duplicate
 */
async function insertTransactionIdempotent(
  userId: number,
  txn: z.infer<typeof TransactionInputSchema>,
  source: string,
  batchId: string,
): Promise<boolean> {
  // Generate external_id if not provided (hash of key fields)
  const externalId =
    txn.external_id || `${source}_${hashKey(userId, txn.transaction_date, txn.amount, txn.merchant_name)}`;

  // Check if transaction already exists
  const existing = await db('transactions')
    .where('user_id', userId)
    .where('external_id', externalId)
    .select('id')
    .first();

  if (existing) {
    // Duplicate - skip silently (idempotent)
    return false;
  }

  // Insert new transaction
  await db('transactions').insert({
    user_id: userId,
    original_merchant_name: txn.merchant_name,
    amount: txn.amount,
    currency: 'GBP',
    transaction_date: txn.transaction_date,
    posted_date: txn.posted_date,
    external_id: externalId,
    description: txn.description || null,
    transaction_type: txn.transaction_type,
    status: 'raw',
    notes: `Imported from ${source} (batch: ${batchId})`,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return true;
}

// ============================================================================
// QUERY TRANSACTIONS
// ============================================================================

/**
 * Get transactions for a user with optional filters
 */
export async function getTransactions(
  userId: number,
  filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    merchantId?: number;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Transaction[]> {
  let query = db('transactions').where('user_id', userId);

  if (filters.startDate) {
    query = query.where('transaction_date', '>=', filters.startDate);
  }

  if (filters.endDate) {
    query = query.where('transaction_date', '<=', filters.endDate);
  }

  if (filters.status) {
    query = query.where('status', filters.status);
  }

  if (filters.merchantId) {
    query = query.where('merchant_id', filters.merchantId);
  }

  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  return query
    .orderBy('transaction_date', 'desc')
    .limit(limit)
    .offset(offset);
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(userId: number, transactionId: number): Promise<Transaction | undefined> {
  return db('transactions').where('user_id', userId).where('id', transactionId).first();
}

/**
 * Get raw transaction count for user
 */
export async function getTransactionCount(
  userId: number,
  filters: { status?: string; startDate?: string; endDate?: string } = {},
): Promise<number> {
  let query = db('transactions').where('user_id', userId);

  if (filters.status) {
    query = query.where('status', filters.status);
  }

  if (filters.startDate) {
    query = query.where('transaction_date', '>=', filters.startDate);
  }

  if (filters.endDate) {
    query = query.where('transaction_date', '<=', filters.endDate);
  }

  const result = await query.count('id as count').first();
  return result?.count || 0;
}

// ============================================================================
// UPDATE TRANSACTION STATUS
// ============================================================================

/**
 * Update transaction status during processing
 */
export async function updateTransactionStatus(
  transactionId: number,
  status: 'raw' | 'processing' | 'processed' | 'error',
  notes?: string,
): Promise<void> {
  const update: any = {
    status,
    updated_at: new Date(),
  };

  if (notes) {
    update.notes = notes;
  }

  await db('transactions').where('id', transactionId).update(update);
}

/**
 * Bulk update statuses for batch processing
 */
export async function updateTransactionStatusBulk(
  transactionIds: number[],
  status: 'raw' | 'processing' | 'processed' | 'error',
): Promise<void> {
  if (transactionIds.length === 0) return;

  await db('transactions')
    .whereIn('id', transactionIds)
    .update({
      status,
      updated_at: new Date(),
    });
}

// ============================================================================
// CATEGORY ASSIGNMENT
// ============================================================================

/**
 * Assign category to transaction
 */
export async function assignCategory(
  transactionId: number,
  categoryId: number,
  confidence: number = 1.0,
  isManualOverride: boolean = false,
): Promise<void> {
  // Remove existing categories if manual override
  if (isManualOverride) {
    await db('transaction_categories').where('transaction_id', transactionId).delete();
  }

  // Insert new category assignment
  await db('transaction_categories').insert({
    transaction_id: transactionId,
    category_id: categoryId,
    confidence: Math.min(confidence, 1.0),
    is_manual_override: isManualOverride,
    created_at: new Date(),
  });
}

/**
 * Get categories for transaction
 */
export async function getTransactionCategories(transactionId: number) {
  return db('transaction_categories')
    .join('categories', 'transaction_categories.category_id', 'categories.id')
    .where('transaction_id', transactionId)
    .select('categories.*', 'transaction_categories.confidence', 'transaction_categories.is_manual_override');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple hash function for idempotency key
 */
function hashKey(...parts: (string | number)[]): string {
  let hash = 0;
  const str = parts.join('|');

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Get spending summary for user
 */
export async function getSpendingSummary(
  userId: number,
  startDate?: string,
  endDate?: string,
): Promise<{
  total_spend: number;
  transaction_count: number;
  average_transaction: number;
}> {
  let query = db('transactions')
    .where('user_id', userId)
    .where('status', 'processed')
    .where('transaction_type', 'debit');

  if (startDate) {
    query = query.where('transaction_date', '>=', startDate);
  }

  if (endDate) {
    query = query.where('transaction_date', '<=', endDate);
  }

  const result = await query
    .sum('amount as total_spend')
    .count('id as count')
    .avg('amount as avg')
    .first();

  return {
    total_spend: parseFloat(result?.total_spend || '0'),
    transaction_count: result?.count || 0,
    average_transaction: parseFloat(result?.avg || '0'),
  };
}
