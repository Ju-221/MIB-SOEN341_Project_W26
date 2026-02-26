import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import fs from 'fs';

// Database paths
const dbPath = './db/mealmajor.db';
const backupPath = './db/mealmajor.bckup';

// Restore from backup if database doesn't exist
if (!fs.existsSync(dbPath) && fs.existsSync(backupPath)) {
  console.log('No database found, using backup database now...');
  fs.copyFileSync(backupPath, dbPath);
  console.log('Database restored from backup.');
}

// Initialize database connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create the db instance
export const db = drizzle(sqlite, { schema });