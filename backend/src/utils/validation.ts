/**
 * Zod validation schemas for all API inputs
 */

import { z } from 'zod';

// ============================================================================
// TRANSACTION VALIDATION
// ============================================================================

export const TransactionInputSchema = z.object({
  transaction_date: z.string().date('Invalid transaction date format (YYYY-MM-DD)'),
  posted_date: z.string().date('Invalid posted date format (YYYY-MM-DD)'),
  merchant_name: z.string().min(1, 'Merchant name required').max(255),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500).optional(),
  transaction_type: z.enum(['debit', 'credit', 'transfer']),
  category_hint: z.string().max(100).optional(),
  external_id: z.string().max(255).optional(),
});

export const TransactionImportSchema = z.object({
  transactions: z.array(TransactionInputSchema).min(1, 'At least one transaction required'),
  source: z.string().optional(),
  batch_id: z.string().optional(),
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;
export type TransactionImport = z.infer<typeof TransactionImportSchema>;

// ============================================================================
// CATEGORY VALIDATION
// ============================================================================

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  icon: z.string().optional(),
});

export type CategoryType = z.infer<typeof CategorySchema>;

// ============================================================================
// QUERY PARAMETERS VALIDATION
// ============================================================================

export const DateRangeQuerySchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CategoryFilterQuerySchema = z.object({
  category_id: z.coerce.number().int().optional(),
  merchant_id: z.coerce.number().int().optional(),
  transaction_type: z.enum(['debit', 'credit', 'transfer']).optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  ...DateRangeQuerySchema.shape,
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type CategoryFilterQuery = z.infer<typeof CategoryFilterQuerySchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateTransactionInput(data: unknown) {
  try {
    return TransactionInputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function validateTransactionImport(data: unknown) {
  try {
    return TransactionImportSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Import validation failed: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
}

export function validateDateRange(query: unknown) {
  try {
    return DateRangeQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Query validation failed: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
}

export function validateCategoryFilter(query: unknown) {
  try {
    return CategoryFilterQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Filter validation failed: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
}
