import { describe, it, expect, beforeEach } from 'vitest';
import { createDbConnection } from './index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { users } from './schema.js';

describe('Database Schema & WAL Mode', () => {
  let db: any;
  let sqlite: any;

  beforeEach(() => {
    const conn = createDbConnection(':memory:');
    db = conn.db;
    sqlite = conn.sqlite;
    migrate(db, { migrationsFolder: './drizzle' });
  });

  it('should verify foreign key pragmas', () => {
    const fkPragma = sqlite.pragma('foreign_keys', { simple: true });
    expect(fkPragma).toBe(1);
  });

  it('should insert user successfully', () => {
    const newUser = db.insert(users).values({
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: 'Test Agent',
    }).returning().get();

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('test@example.com');
  });
});
