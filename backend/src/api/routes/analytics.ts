/**
 * Analytics API Routes
 * GET /api/analytics/summary - Overall spending summary
 * GET /api/analytics/trends - Trend metrics
 * GET /api/analytics/categories - Category breakdown
 * GET /api/analytics/budget - Budget status
 * GET /api/analytics/insights - Generated insights
 */

import { Router, Request, Response } from 'express';
import * as analyticsService from '../../services/analyticsService';
import * as insightsService from '../../services/insightsService';

const router = Router();

const DEFAULT_USER_ID = 1; // TODO: Replace with actual user from auth middleware

// ============================================================================
// SUMMARY ENDPOINT
// ============================================================================

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await analyticsService.getCompleteSummary(DEFAULT_USER_ID);

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

// ============================================================================
// TRENDS ENDPOINT
// ============================================================================

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const trends = await analyticsService.getTrendMetrics(DEFAULT_USER_ID);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// CATEGORIES ENDPOINT
// ============================================================================

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.start_date as string) || undefined;
    const endDate = (req.query.end_date as string) || undefined;
    const limit = parseInt((req.query.limit as string) || '10');

    const categories = await analyticsService.getTopCategories(DEFAULT_USER_ID, limit, startDate, endDate);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// BUDGET STATUS ENDPOINT
// ============================================================================

router.get('/budget', async (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || undefined;

    const budgetStatus = await analyticsService.getBudgetStatus(DEFAULT_USER_ID, month);

    res.json({
      success: true,
      data: budgetStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// DAILY SUMMARY ENDPOINT
// ============================================================================

router.get('/daily/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format (use YYYY-MM-DD)',
      });
    }

    const summary = await analyticsService.getDailySummary(DEFAULT_USER_ID, date);

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

// ============================================================================
// MONTHLY SUMMARY ENDPOINT
// ============================================================================

router.get('/monthly/:yearMonth', async (req: Request, res: Response) => {
  try {
    const { yearMonth } = req.params;

    // Validate format (YYYY-MM)
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format (use YYYY-MM)',
      });
    }

    const summary = await analyticsService.getMonthlySummary(DEFAULT_USER_ID, yearMonth);

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

// ============================================================================
// INSIGHTS ENDPOINTS
// ============================================================================

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '10');

    const insights = await insightsService.getRecentInsights(DEFAULT_USER_ID, limit);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/insights/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    const validTypes = [
      'spending_increase',
      'spending_decrease',
      'top_category',
      'subscription_cost',
      'budget_exceeded',
      'budget_remaining',
      'merchant_spike',
      'category_trend',
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid insight type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    const insights = await insightsService.getInsightsByType(DEFAULT_USER_ID, type);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
