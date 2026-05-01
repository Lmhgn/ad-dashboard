/**
 * Database initialization script
 * Run with: npm run db:init
 *
 * This script:
 * 1. Creates all tables (from schema.sql)
 * 2. Seeds default categories
 * 3. Creates test user
 */

import fs from 'fs';
import path from 'path';
import db from '../src/db/connection';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...\n');

    // Read schema.sql
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('📋 Creating schema...');
    const statements = schema.split(';').filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.raw(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!(error instanceof Error && error.message.includes('already exists'))) {
            console.error('Error executing statement:', statement.substring(0, 100));
            throw error;
          }
        }
      }
    }

    console.log('✅ Schema created\n');

    // Seed test user
    console.log('👤 Creating test user...');
    const userId = await db('users')
      .insert({
        email: 'user@example.com',
        name: 'Test User',
        currency: 'GBP',
        timezone: 'UTC',
        subscription_tier: 'premium',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('email')
      .ignore()
      .returning('id');

    console.log(`✅ Test user created (ID: ${userId[0] || 'exists'})\n`);

    // Verify categories exist
    const categoryCount = await db('categories').count('* as count').first();
    console.log(`✅ Database initialized with ${categoryCount.count} categories\n`);

    console.log('✨ Database initialization complete!');
    console.log('You can now run: npm run dev');

    await db.destroy();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
