import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

describe('Phase 7: Human Approval System API & Domain Workflows', () => {
  let app: any;
  let testDbConn: any;

  beforeEach(() => {
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);
  });

  it('fetches pending reviews requiring human confirmation', async () => {
    // 1. Create customer first
    const custRes = await request(app)
      .post('/api/customers')
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    // 2. Post requirement without manual verification
    await request(app)
      .post('/api/requirements')
      .send({
        customerId,
        intent: 'RENT',
        propertyType: 'APARTMENT',
        minBedrooms: 2,
        minBudget: 20000,
        maxBudget: 25000,
        isVerifiedManually: false,
      })
      .expect(201);

    const res = await request(app).get('/api/reviews/pending').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].requirement.isVerifiedManually).toBe(false);
  });

  it('approves requirement review setting isVerifiedManually = true', async () => {
    // 1. Create customer
    const custRes = await request(app)
      .post('/api/customers')
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    // 2. Create requirement
    const reqRes = await request(app)
      .post('/api/requirements')
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 2,
        maxBudget: 25000,
        isVerifiedManually: false,
      })
      .expect(201);

    const reqId = reqRes.body.data.id;

    // 2. Approve review
    const approveRes = await request(app)
      .post(`/api/reviews/${reqId}/approve`)
      .send({ maxBudget: 25000 })
      .expect(200);

    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.isVerifiedManually).toBe(true);
  });

  it('rejects requirement review setting isActive = false', async () => {
    // 1. Create customer
    const custRes = await request(app)
      .post('/api/customers')
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    // 2. Create requirement
    const reqRes = await request(app)
      .post('/api/requirements')
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 2,
        maxBudget: 25000,
        isVerifiedManually: false,
      })
      .expect(201);

    const reqId = reqRes.body.data.id;

    // 2. Reject review
    const rejectRes = await request(app)
      .post(`/api/reviews/${reqId}/reject`)
      .expect(200);

    expect(rejectRes.body.success).toBe(true);
    expect(rejectRes.body.data.isActive).toBe(false);
  });
});
