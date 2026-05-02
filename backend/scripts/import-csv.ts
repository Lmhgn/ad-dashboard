/**
 * CSV Import Script
 * Run with: npm run import-csv <path-to-csv>
 *
 * Reads CSV file and imports transactions via the transaction service
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parse/sync';
import * as transactionService from '../src/services/transactionService';
import db from '../src/db/connection';

const CSV_FILE = process.argv[2] || path.join(__dirname, '../../data/mock-transactions.csv');
const USER_ID = 1; // Default test user

async function importCSV() {
  try {
    if (!fs.existsSync(CSV_FILE)) {
      console.error(`❌ File not found: ${CSV_FILE}`);
      process.exit(1);
    }

    console.log(`📥 Reading CSV: ${CSV_FILE}\n`);

    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');

    // Parse CSV
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${records.length} transactions\n`);

    // Convert CSV records to import format
    const transactions = records.map((record: any) => ({
      transaction_date: record.transaction_date,
      posted_date: record.posted_date,
      merchant_name: record.merchant_name,
      amount: parseFloat(record.amount),
      description: record.description || undefined,
      transaction_type: record.transaction_type,
      category_hint: record.category_hint || undefined,
      external_id: `csv_${record.transaction_date}_${record.merchant_name}_${record.amount}`,
    }));

    // Import transactions
    console.log('⏳ Importing transactions...\n');
    const result = await transactionService.importTransactions(
      USER_ID,
      { transactions },
      'csv_import',
    );

    // Print results
    console.log('✅ Import Complete!');
    console.log(`   Imported: ${result.imported}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.slice(0, 5).forEach((err) => {
        console.log(`   Row ${err.row}: ${err.error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more errors`);
      }
    }

    console.log(`\n📍 Batch ID: ${result.batch_id}`);

    // Verify import
    const count = await db('transactions').where('user_id', USER_ID).count('* as count').first();
    console.log(`📈 Total transactions in database: ${count?.count || 0}\n`);

    await db.destroy();
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importCSV();
