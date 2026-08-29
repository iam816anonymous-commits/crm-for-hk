import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createTestAuthUser } from './test-utils.js';

describe('Phase 1 Integration Tests', () => {
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

  it('1. Contact creation and E.164 phone normalization', async () => {
    const res = await supertest(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '(415) 555-2671',
        firstName: 'Alice',
        lastName: 'Smith',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phoneNormalized).toBe('+14155552671');
  });

  it('2. Duplicate phone detection & canonical contact resolution', async () => {
    const res1 = await supertest(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+14155559999', firstName: 'Alice Original' });

    const res2 = await supertest(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '14155559999', firstName: 'Alice Updated' });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.data.id).toBe(res2.body.data.id); // Same canonical contact ID resolved
  });

  it('3. Property creation belonging to an owner', async () => {
    const ownerRes = await supertest(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+14155550001', firstName: 'Landlord', companyName: 'Landlord Co' });

    expect(ownerRes.status).toBe(201);
    const ownerId = ownerRes.body.data.id;

    const propRes = await supertest(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ownerId,
        title: 'Sunset Apartment',
        propertyType: 'APARTMENT',
        listingType: 'RENT',
        address: '123 Market St',
        city: 'San Francisco',
        monthlyRent: 3500,
      });

    expect(propRes.status).toBe(201);
    expect(propRes.body.data.ownerId).toBe(ownerId);
  });

  it('4. Requirement creation belonging to a customer', async () => {
    const custRes = await supertest(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+14155550002', firstName: 'Tenant Bob', customerType: 'TENANT' });

    expect(custRes.status).toBe(201);
    const customerId = custRes.body.data.id;

    const reqRes = await supertest(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        intent: 'RENT',
        propertyType: 'APARTMENT',
        minBedrooms: 2,
        minBudget: 2000,
        maxBudget: 4000,
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.data.customerId).toBe(customerId);
  });

  it('5. Relationship integrity & foreign key constraint enforcement', async () => {
    const res = await supertest(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ownerId: 'non-existent-owner-uuid',
        title: 'Orphan Property',
        propertyType: 'APARTMENT',
        listingType: 'RENT',
        address: '454 Unknown Rd',
        city: 'San Francisco',
      });

    expect(res.status).toBe(400); // Bad Request from FK rejection
  });

  it('6. Validation failures (Zod schema rejection)', async () => {
    const res = await supertest(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('7. Rule #10: Do not silently overwrite manually verified information with AI extractions', async () => {
    const custRes = await supertest(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ phoneRaw: '+14155558888', firstName: 'Verified User' });
    const customerId = custRes.body.data.id;

    const reqRes = await supertest(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 3,
        isVerifiedManually: true, // Mark manually verified
      });

    const reqId = reqRes.body.data.id;

    // Simulate unstructured AI extraction input
    const extractRes = await supertest(app)
      .post('/api/extract')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '+14155558888',
        inputText: 'I am looking for a 1BHK apartment for rent under 1500',
      });

    expect(extractRes.body.data.status).toBe('SKIPPED_MANUAL_VERIFIED');
    expect(extractRes.body.data.requirement.id).toBe(reqId);
    expect(extractRes.body.data.requirement.minBedrooms).toBe(3); // Preserved original manually verified value!
  });
});
