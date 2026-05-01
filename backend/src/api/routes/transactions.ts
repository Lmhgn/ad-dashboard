/**
 * Transaction API Routes
 * POST /api/transactions/import - Import transactions
 * GET /api/transactions - List transactions
 * GET /api/transactions/:id - Get single transaction
 */

import { Router, Request, Response } from 'express';
import * as transactionService from '../../services/transactionService';
import { TransactionImportSchema } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

const DEFAULT_USER_ID = 1; // TODO: Replace with actual user from auth middleware

// ============================================================================
// IMPORT TRANSACTIONS
// ============================================================================

router.post('/import', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const importData = TransactionImportSchema.parse(req.body);

    // Import transactions
    const result = await transactionService.importTransactions(DEFAULT_USER_ID, importData, req.body.source);

    res.json({
      success: true,
      message: `Imported ${result.imported} transactions, skipped ${result.skipped}, ${result.errors.length} errors`,
      batch_id: result.batch_id,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// LIST TRANSACTIONS
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.start_date as string | undefined,
      endDate: req.query.end_date as string | undefined,
      status: req.query.status as string | undefined,
      merchantId: req.query.merchant_id ? parseInt(req.query.merchant_id as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const transactions = await transactionService.getTransactions(DEFAULT_USER_ID, filters);

    const count = await transactionService.getTransactionCount(DEFAULT_USER_ID, {
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: count,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET SINGLE TRANSACTION
// ============================================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID',
      });
    }

    const transaction = await transactionService.getTransactionById(DEFAULT_USER_ID, transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET SPENDING SUMMARY
// ============================================================================

router.get('/summary/total', async (req: Request, res: Response) => {
  try {
    const summary = await transactionService.getSpendingSummary(
      DEFAULT_USER_ID,
      req.query.start_date as string | undefined,
      req.query.end_date as string | undefined,
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
