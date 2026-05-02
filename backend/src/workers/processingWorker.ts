/**
 * Processing Worker - Batch job to process raw transactions
 * Runs categorization, merchant normalization, and subscription detection
 *
 * Run with: npm run worker:process
 */

import db from '../db/connection';
import * as transactionService from '../services/transactionService';
import * as categorizationService from '../services/categorizationService';
import * as merchantService from '../services/merchantService';
import * as subscriptionService from '../services/subscriptionService';
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
// PROCESSING PIPELINE
// ============================================================================

/**
 * Process all raw transactions
 * Steps:
 * 1. Fetch raw transactions
 * 2. Normalize merchants (create merchant records, deduplicate)
 * 3. Categorize transactions
 * 4. Detect subscriptions
 * 5. Mark as processed
 */
async function processRawTransactions(userId: number = 1) {
  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    log('START', `Processing transactions for user ${userId}`);

    // Step 1: Fetch raw transactions
    log('FETCH', 'Fetching raw transactions...');
    const rawTransactions = await db('transactions')
      .where('user_id', userId)
      .where('status', 'raw')
      .select('id', 'original_merchant_name')
      .orderBy('id', 'asc');

    if (rawTransactions.length === 0) {
      log('FETCH', 'No raw transactions found');
      return;
    }

    log('FETCH', `Found ${rawTransactions.length} raw transactions`);

    // Step 2: Normalize merchants
    log('MERCHANTS', 'Processing merchant normalization...');
    const merchantResult = await merchantService.processTransactionMerchants(userId, rawTransactions);
    log(
      'MERCHANTS',
      `✓ Processed: ${merchantResult.processed}, New: ${merchantResult.new_merchants}, Duplicates: ${merchantResult.duplicates_found}`,
    );
    if (merchantResult.errors.length > 0) {
      log('MERCHANTS', `⚠ Errors: ${merchantResult.errors.length}`);
      errorCount += merchantResult.errors.length;
    }

    // Step 3: Categorize transactions
    log('CATEGORIZE', 'Categorizing transactions...');
    const categorizationResult = await categorizationService.categorizeTransactionsBatch(rawTransactions);
    log('CATEGORIZE', `✓ Categorized: ${categorizationResult.categorized}`);
    if (categorizationResult.failed > 0) {
      log('CATEGORIZE', `⚠ Failed: ${categorizationResult.failed}`);
      errorCount += categorizationResult.failed;
    }

    // Step 4: Update status to processed
    log('STATUS', 'Updating transaction status to "processed"...');
    const transactionIds = rawTransactions.map((t) => t.id);
    await transactionService.updateTransactionStatusBulk(transactionIds, 'processed');
    processedCount = transactionIds.length - errorCount;
    log('STATUS', `✓ Updated ${processedCount} transactions to "processed"`);

    // Step 5: Detect subscriptions
    log('SUBSCRIPTIONS', 'Detecting subscriptions...');
    const subscriptionResult = await subscriptionService.detectSubscriptions(userId);
    log('SUBSCRIPTIONS', `✓ Detected: ${subscriptionResult.detected}, Created: ${subscriptionResult.created}`);
    if (subscriptionResult.errors.length > 0) {
      log('SUBSCRIPTIONS', `⚠ Errors: ${subscriptionResult.errors.length}`);
    }

    // Summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(
      'COMPLETE',
      `Processing complete! Processed: ${processedCount}, Errors: ${errorCount}, Duration: ${duration}s`,
    );
  } catch (error) {
    log('ERROR', `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// ============================================================================
// SCHEDULED EXECUTION
// ============================================================================

/**
 * Start scheduled processing job
 * Default: 2 AM daily (controlled by BATCH_SCHEDULE_CRON env var)
 */
function startScheduledJob() {
  const schedule = process.env.BATCH_SCHEDULE_CRON || '0 2 * * *'; // 2 AM daily
  const enableJob = process.env.ENABLE_CATEGORIZATION_JOB === 'true';

  if (!enableJob) {
    console.log('Batch processing job is disabled (ENABLE_CATEGORIZATION_JOB=false)');
    return;
  }

  log('SCHEDULER', `Starting batch processing job with schedule: "${schedule}"`);

  cron.schedule(schedule, async () => {
    log('SCHEDULER', 'Running scheduled processing job...');
    try {
      await processRawTransactions(1); // TODO: Support multiple users
    } catch (error) {
      log('SCHEDULER', `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  log('SCHEDULER', 'Batch processing job scheduled');
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
      log('START', 'Running immediate processing job...');
      await processRawTransactions(1);
      await db.destroy();
      log('END', 'Processing complete, exiting');
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

export { processRawTransactions, startScheduledJob };
