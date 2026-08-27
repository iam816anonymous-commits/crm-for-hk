import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

describe('Phase 1 Integration Tests', () => {
  let app: any;
  let testDbConn: any;

  beforeEach(() => {
    // Reset test database in memory
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);
  });

  it('1. Contact creation and E.164 phone normalization', async () => {
    const res = await supertest(app)
      .post('/api/contacts')
      .send({
        phoneRaw: '(415) 555-2671',
        firstName: 'John',
        lastName: 'Doe',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phoneNormalized).toBe('+14155552671');
  });

  it('2. Duplicate phone detection & canonical contact resolution', async () => {
    const res1 = await supertest(app)
      .post('/api/contacts')
      .send({ phoneRaw: '+14155559999', firstName: 'Alice' });

    const res2 = await supertest(app)
      .post('/api/contacts')
      .send({ phoneRaw: '14155559999', firstName: 'Alice Updated' });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.data.id).toBe(res2.body.data.id); // Same canonical contact ID!
  });

  it('3. Property creation belonging to an owner', async () => {
    // Create Owner first
    const ownerRes = await supertest(app)
      .post('/api/owners')
      .send({ phoneRaw: '+14155550001', firstName: 'Landlord', companyName: 'Acme Properties' });

    expect(ownerRes.status).toBe(201);
    const ownerId = ownerRes.body.data.id;

    // Create Property
    const propRes = await supertest(app)
      .post('/api/properties')
      .send({
        ownerId,
        title: 'Modern 2BHK Apartment',
        propertyType: 'APARTMENT',
        listingType: 'RENT',
        address: '123 Main St',
        city: 'San Francisco',
        bedrooms: 2,
        bathrooms: 2,
        monthlyRent: 3500,
      });

    expect(propRes.status).toBe(201);
    expect(propRes.body.data.ownerId).toBe(ownerId);
  });

  it('4. Requirement creation belonging to a customer', async () => {
    // Create Customer
    const custRes = await supertest(app)
      .post('/api/customers')
      .send({ phoneRaw: '+14155550002', firstName: 'Tenant Bob', customerType: 'TENANT' });

    expect(custRes.status).toBe(201);
    const customerId = custRes.body.data.id;

    // Create Requirement
    const reqRes = await supertest(app)
      .post('/api/requirements')
      .send({
        customerId,
        intent: 'RENT',
        propertyType: 'APARTMENT',
        minBedrooms: 2,
        maxBudget: 4000,
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.data.customerId).toBe(customerId);
  });

  it('5. Relationship integrity & foreign key constraint enforcement', async () => {
    const res = await supertest(app)
      .post('/api/properties')
      .send({
        ownerId: '00000000-0000-0000-0000-000000000000',
        title: 'Orphan Property',
        propertyType: 'APARTMENT',
        listingType: 'RENT',
        address: '454 Nowhere St',
        city: 'Ghost Town',
      });

    expect(res.status).toBe(500); // SQLITE_CONSTRAINT_FOREIGNKEY
  });

  it('6. Validation failures (Zod schema rejection)', async () => {
    const res = await supertest(app)
      .post('/api/contacts')
      .send({
        phoneRaw: '123', // Too short
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('7. Rule #10: Do not silently overwrite manually verified information with AI extractions', async () => {
    // 1. Manually create customer requirement and set isVerifiedManually = true
    const custRes = await supertest(app)
      .post('/api/customers')
      .send({ phoneRaw: '+14155558888', firstName: 'Verified User' });
    const customerId = custRes.body.data.id;

    const reqRes = await supertest(app)
      .post('/api/requirements')
      .send({
        customerId,
        intent: 'RENT',
        minBedrooms: 3,
        maxBudget: 5000,
        isVerifiedManually: true,
      });

    expect(reqRes.body.data.isVerifiedManually).toBe(true);

    // 2. Trigger AI extraction for the same phone number with conflicting data
    const extractRes = await supertest(app)
      .post('/api/extract')
      .send({
        phoneRaw: '+14155558888',
        inputText: 'I want to buy a studio apartment for $1000',
      });

    expect(extractRes.status).toBe(200);
    expect(extractRes.body.data.status).toBe('SKIPPED_MANUAL_VERIFIED');
    expect(extractRes.body.data.requirement.minBedrooms).toBe(3); // Preserved manual value!
  });
});
