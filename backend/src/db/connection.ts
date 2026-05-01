/**
 * Database connection setup using Knex.js
 */

import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const db: Knex = knex({
  client: 'pg',
  connection: DATABASE_URL,
  pool: {
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  },
  acquireConnectionTimeout: 10000,
  searchPath: ['public'],
});

// ============================================================================
// CONNECTION HEALTH CHECK
// ============================================================================

export async function healthCheck(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

export async function closeConnection(): Promise<void> {
  await db.destroy();
  console.log('Database connection closed');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default db;

export const query = db.queryBuilder.bind(db);
