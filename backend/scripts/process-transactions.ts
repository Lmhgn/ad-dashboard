/**
 * Transaction Processing Script
 * Run with: npm run process-transactions
 *
 * This script processes all raw transactions:
 * - Normalizes merchants
 * - Categorizes transactions
 * - Detects subscriptions
 */

import { processRawTransactions } from '../src/workers/processingWorker';
import db from '../src/db/connection';

async function main() {
  try {
    console.log('🔄 Starting transaction processing...\n');

    const startTime = Date.now();

    // Process transactions (user ID 1 = default test user)
    await processRawTransactions(1);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Processing complete in ${duration}s`);

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Processing failed:', error);
    await db.destroy();
    process.exit(1);
  }
}

main();
