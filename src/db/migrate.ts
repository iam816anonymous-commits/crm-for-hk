import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './index.js';

export function runMigrations() {
  console.log('Running database migrations...');
  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrations completed successfully.');
  } catch (err: any) {
    console.warn('Migration warning (continuing execution):', err.message);
  }
}

if (process.env.NODE_ENV !== 'test') {
  runMigrations();
}
