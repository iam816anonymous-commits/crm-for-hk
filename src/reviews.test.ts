import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createTestAuthUser } from './test-utils.js';

describe('Phase 7: Human Approval System API & Domain Workflows', () => {
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

  it('fetches pending reviews requiring human confirmation', async () => {
    const custRes = await supertest(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    await supertest(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 2,
        isVerifiedManually: false,
      })
      .expect(201);

    const res = await supertest(app)
      .get('/api/reviews/pending')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].requirement.isVerifiedManually).toBe(false);
  });

  it('approves requirement review setting isVerifiedManually = true', async () => {
    const custRes = await supertest(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    const reqRes = await supertest(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 2,
        isVerifiedManually: false,
      })
      .expect(201);

    const reqId = reqRes.body.data.id;

    const approveRes = await supertest(app)
      .post(`/api/reviews/${reqId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ minBedrooms: 3 })
      .expect(200);

    expect(approveRes.body.data.isVerifiedManually).toBe(true);
    expect(approveRes.body.data.minBedrooms).toBe(3);
  });

  it('rejects requirement review setting isActive = false', async () => {
    const custRes = await supertest(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+919876543210', firstName: 'Ravi' })
      .expect(201);

    const customerId = custRes.body.data.id;

    const reqRes = await supertest(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 2,
        isVerifiedManually: false,
      })
      .expect(201);

    const reqId = reqRes.body.data.id;

    const rejectRes = await supertest(app)
      .post(`/api/reviews/${reqId}/reject`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(rejectRes.body.data.isActive).toBe(false);
    expect(rejectRes.body.data.isVerifiedManually).toBe(false);
  });
});
