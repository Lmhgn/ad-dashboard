/**
 * Analytics Worker - Batch job to compute metrics and generate insights
 * Run with: npm run worker:analytics
 *
 * Steps:
 * 1. Compute all analytics metrics
 * 2. Generate insights
 * 3. Clear old insights
 * 4. Update insights table
 */

import db from '../db/connection';
import * as analyticsService from '../services/analyticsService';
import * as insightsService from '../services/insightsService';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// LOGGER
// ============================================================================

function log(stage: string, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${stage}] ${message}`);
}

// ============================================================================
// ANALYTICS COMPUTATION
// ============================================================================

/**
 * Compute all analytics for a user
 */
async function computeAnalytics(userId: number = 1) {
  const startTime = Date.now();

  try {
    log('START', `Computing analytics for user ${userId}`);

    // Step 1: Clear old insights (keep last 30 days)
    log('CLEANUP', 'Clearing old insights...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const deletedCount = await db('insights')
      .where('user_id', userId)
      .where('created_at', '<', thirtyDaysAgo)
      .delete();

    log('CLEANUP', `Deleted ${deletedCount} old insights`);

    // Step 2: Compute trends
    log('TRENDS', 'Computing trend metrics...');
    const trends = await analyticsService.getTrendMetrics(userId);
    log('TRENDS', `✓ Computed trends: MoM change ${trends.mom_change_percent}%`);

    // Step 3: Get monthly summary
    log('MONTHLY', 'Computing monthly summary...');
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlySummary = await analyticsService.getMonthlySummary(userId, monthYear);
    log('MONTHLY', `✓ Monthly spend: £${monthlySummary.total_spend.toFixed(2)}`);

    // Step 4: Get budget status
    log('BUDGETS', 'Computing budget status...');
    const budgetStatus = await analyticsService.getBudgetStatus(userId, monthYear);
    log('BUDGETS', `✓ Analyzed ${budgetStatus.length} budget categories`);

    // Step 5: Generate insights
    log('INSIGHTS', 'Generating insights...');
    const insightResult = await insightsService.generateInsights(userId);
    log('INSIGHTS', `✓ Generated ${insightResult.generated} insights`);

    if (insightResult.errors.length > 0) {
      log('INSIGHTS', `⚠ Errors: ${insightResult.errors.length}`);
      insightResult.errors.slice(0, 3).forEach((err) => {
        log('INSIGHTS', `  ${err.error}`);
      });
    }

    // Summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(
      'COMPLETE',
      `Analytics computation complete! Trends: computed, Monthly: £${monthlySummary.total_spend.toFixed(2)}, Budgets: ${budgetStatus.length}, Insights: ${insightResult.generated}, Duration: ${duration}s`,
    );
  } catch (error) {
    log('ERROR', `Analytics computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// ============================================================================
// SCHEDULED EXECUTION
// ============================================================================

/**
 * Start scheduled analytics job
 * Default: 3 AM daily (after processing job at 2 AM)
 */
function startScheduledJob() {
  const schedule = process.env.BATCH_SCHEDULE_CRON || '0 3 * * *'; // 3 AM daily
  const enableJob = process.env.ENABLE_ANALYTICS_JOB === 'true';

  if (!enableJob) {
    console.log('Batch analytics job is disabled (ENABLE_ANALYTICS_JOB=false)');
    return;
  }

  log('SCHEDULER', `Starting batch analytics job with schedule: "${schedule}"`);

  cron.schedule(schedule, async () => {
    log('SCHEDULER', 'Running scheduled analytics job...');
    try {
      await computeAnalytics(1); // TODO: Support multiple users
    } catch (error) {
      log('SCHEDULER', `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  log('SCHEDULER', 'Batch analytics job scheduled');
}

// ============================================================================
// IMMEDIATE EXECUTION (for manual runs)
// ============================================================================

async function main() {
  try {
    // Check if running as scheduled or immediate
    const isScheduled = process.argv.includes('--schedule');

    if (isScheduled) {
      startScheduledJob();
      // Keep process running for scheduled jobs
      process.on('SIGINT', async () => {
        log('SHUTDOWN', 'Graceful shutdown...');
        await db.destroy();
        process.exit(0);
      });
    } else {
      // Run immediately
      log('START', 'Running immediate analytics computation...');
      await computeAnalytics(1);
      await db.destroy();
      log('END', 'Analytics computation complete, exiting');
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    await db.destroy();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { computeAnalytics, startScheduledJob };
