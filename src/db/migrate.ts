import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';

export function runMigrations() {
  console.log('Running database migrations...');
  migrate(db, { migrationsFolder: './drizzle' });
  console.log('Database migrations completed successfully.');
}

if (process.env.NODE_ENV !== 'test') {
  runMigrations();
}
