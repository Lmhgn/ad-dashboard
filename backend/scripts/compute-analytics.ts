/**
 * Analytics Computation Script
 * Run with: npm run compute-analytics
 *
 * This script computes all analytics and generates insights:
 * - Trend metrics (MoM, rolling averages)
 * - Category performance
 * - Budget status
 * - Actionable insights
 */

import { computeAnalytics } from '../src/workers/analyticsWorker';
import db from '../src/db/connection';

async function main() {
  try {
    console.log('📊 Starting analytics computation...\n');

    const startTime = Date.now();

    // Compute analytics (user ID 1 = default test user)
    await computeAnalytics(1);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Analytics computation complete in ${duration}s`);

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Analytics computation failed:', error);
    await db.destroy();
    process.exit(1);
  }
}

main();
