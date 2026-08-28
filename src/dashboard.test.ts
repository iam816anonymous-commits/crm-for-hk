import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

describe('Dashboard & Contact Detail API Tests', () => {
  let app: any;
  let testDbConn: any;

  beforeEach(() => {
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);
  });

  it('1. GET /api/dashboard/stats should return dashboard statistics', async () => {
    const res = await supertest(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProperties).toBeDefined();
    expect(res.body.data.availableProperties).toBeDefined();
    expect(res.body.data.occupiedProperties).toBeDefined();
    expect(res.body.data.newLeads).toBeDefined();
  });

  it('2. GET /api/contacts/:id/details should return contact profile matching specs', async () => {
    // 1. Create Ravi Kumar contact
    const contactRes = await supertest(app)
      .post('/api/contacts')
      .send({
        phoneRaw: '+919876543210',
        firstName: 'RAVI',
        lastName: 'KUMAR',
      });

    expect(contactRes.status).toBe(201);
    const contactId = contactRes.body.data.id;

    // 2. Query contact details
    const res = await supertest(app).get(`/api/contacts/${contactId}/details`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('RAVI KUMAR');
    expect(res.body.data.phoneFormatted).toBe('+919876543210');
    expect(res.body.data.requirements.bhk).toBe('2BHK');
    expect(res.body.data.requirements.location).toBe('Whitefield');
    expect(res.body.data.requirements.budget).toBe('₹25,000');
    expect(res.body.data.interactionsCount.whatsapp).toBe(12);
    expect(res.body.data.interactionsCount.calls).toBe(4);
    expect(res.body.data.interactionsCount.visits).toBe(2);
    expect(res.body.data.propertiesShown).toBe(5);
    expect(res.body.data.propertiesRejected).toBe(2);
  });
});
