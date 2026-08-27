import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export function createDbConnection(dbPath: string = process.env.DATABASE_URL || './data/rental_crm.db') {
  const sqlite = new Database(dbPath);

  // Rule #14: SQLite WAL mode and Foreign Keys enforcement
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}

const defaultConn = createDbConnection();
export const sqlite = defaultConn.sqlite;
export const db = defaultConn.db;
