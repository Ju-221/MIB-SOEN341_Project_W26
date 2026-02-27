import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import fs from 'fs';
import { execSync } from 'child_process';

// Database paths
const dbPath = './db/mealmajor.db';
const backupPath = './db/mealmajor.bkcp';

// Restore from backup if database doesn't exist
if (!fs.existsSync(dbPath) && fs.existsSync(backupPath)) {
  console.log('No database found, using backup database now...');
  fs.copyFileSync(backupPath, dbPath);
  console.log('Database restored from backup.');
  
  // Push schema to ensure tables are created (ignore errors if they already exist)
  try {
    console.log('Initializing database schema...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('Database schema initialized.');
  } catch (error: any) {
    // Ignore "already exists" errors since backup already has the schema
    if (error.stderr?.includes('already exists') || error.message?.includes('already exists')) {
      console.log('Schema already exists in backup, skipping push');
    } else {
      console.error('Failed to initialize database schema:', error);
    }
  }
}

// Initialize database connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create the db instance
export const db = drizzle(sqlite, { schema });