import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createTestAuthUser } from './test-utils.js';

describe('Dashboard & Contact Detail API Tests', () => {
  let app: any;
  let testDbConn: any;
  let authToken: string;

  beforeEach(async () => {
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);

    const auth = await createTestAuthUser(testDbConn.db);
    authToken = auth.token;
  });

  it('1. GET /api/dashboard/stats should return dashboard statistics', async () => {
    const res = await supertest(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProperties).toBeDefined();
    expect(res.body.data.availableProperties).toBeDefined();
  });

  it('2. GET /api/contacts/:id/details should return contact profile matching specs', async () => {
    // 1. Create Ravi Kumar contact
    const contactRes = await supertest(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '+919876543210',
        firstName: 'RAVI',
        lastName: 'KUMAR',
      });

    expect(contactRes.status).toBe(201);
    const contactId = contactRes.body.data.id;

    // 2. Fetch Detailed Profile
    const res = await supertest(app)
      .get(`/api/contacts/${contactId}/details`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('RAVI KUMAR');
    expect(res.body.data.phoneFormatted).toBe('+919876543210');
  });
});
