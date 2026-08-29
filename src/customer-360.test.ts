import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { db } from './db/index.js';
import { createTestAuthUser } from './test-utils.js';
import { contacts, customers, requirements, interactions, calls } from './db/schema.js';

describe('Customer 360 & Conversation Intelligence API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(db);
  });

  it('aggregates Customer 360 profile with unified timeline, requirement, and interactions', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const phone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

    const authA = await createTestAuthUser(db, {
      id: `usr-360-a-${randomId}`,
      organizationId: `org-360-a-${randomId}`,
      email: `usra-${randomId}@360.com`,
    });

    const contactId = `contact-360-${randomId}`;
    db.insert(contacts).values({
      id: contactId,
      organizationId: authA.user.organizationId,
      phoneRaw: phone,
      phoneNormalized: phone,
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: `aarav-${randomId}@example.com`,
      isVerifiedManually: true,
    }).run();

    const customerId = `cust-360-${randomId}`;
    db.insert(customers).values({
      id: customerId,
      organizationId: authA.user.organizationId,
      contactId,
      customerType: 'TENANT',
    }).run();

    db.insert(requirements).values({
      id: `req-360-${randomId}`,
      organizationId: authA.user.organizationId,
      customerId,
      intent: 'RENT',
      minBedrooms: 2,
      maxBudget: 35000,
      furnishingStatus: 'SEMI_FURNISHED',
      preferredLocations: JSON.stringify(['HSR Layout', 'Koramangala']),
    }).run();

    db.insert(interactions).values({
      id: `inter-360-${randomId}`,
      organizationId: authA.user.organizationId,
      contactId,
      customerId,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      summary: 'Inquired about 2BHK rental options in HSR Layout',
    }).run();

    db.insert(calls).values({
      id: `call-360-${randomId}`,
      interactionId: `inter-360-${randomId}`,
      fromNumber: phone,
      toNumber: '+919999999999',
      durationSeconds: 145,
      callStatus: 'COMPLETED',
      transcript: 'Customer verified budget limit is 35k INR.',
    }).run();

    const response = await request(app)
      .get(`/api/contacts/${contactId}/360`)
      .set('Authorization', `Bearer ${authA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.name).toBe('Aarav Sharma');
    expect(data.isVerifiedManually).toBe(true);
    expect(data.requirement.minBedrooms).toBe(2);
    expect(data.requirement.maxBudget).toBe(35000);
    expect(data.timeline).toBeDefined();
    expect(data.timeline.length).toBeGreaterThanOrEqual(2);

    const callEvent = data.timeline.find((t: any) => t.type === 'CALL');
    expect(callEvent).toBeDefined();
    expect(callEvent.summary).toContain('Customer verified budget limit');
  });

  it('enforces multi-tenant isolation and rejects cross-tenant Customer 360 requests (IDOR Protection)', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const phone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;

    const authA = await createTestAuthUser(db, {
      id: `usr-tenant-a-${randomId}`,
      organizationId: `org-tenant-a-${randomId}`,
      email: `usra-${randomId}@tenant.com`,
    });

    const authB = await createTestAuthUser(db, {
      id: `usr-tenant-b-${randomId}`,
      organizationId: `org-tenant-b-${randomId}`,
      email: `usrb-${randomId}@tenant.com`,
    });

    const contactId = `contact-org-a-private-${randomId}`;
    db.insert(contacts).values({
      id: contactId,
      organizationId: authA.user.organizationId,
      phoneRaw: phone,
      phoneNormalized: phone,
      firstName: 'Private',
      lastName: 'Tenant',
    }).run();

    const response = await request(app)
      .get(`/api/contacts/${contactId}/360`)
      .set('Authorization', `Bearer ${authB.token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not found or unauthorized');
  });

  it('handles empty customer profile cleanly without failing or returning hardcoded demo data', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const phone = `+9196${Math.floor(10000000 + Math.random() * 90000000)}`;

    const authA = await createTestAuthUser(db, {
      id: `usr-empty-a-${randomId}`,
      organizationId: `org-empty-a-${randomId}`,
      email: `usrempty-${randomId}@a.com`,
    });

    const contactId = `contact-empty-360-${randomId}`;
    db.insert(contacts).values({
      id: contactId,
      organizationId: authA.user.organizationId,
      phoneRaw: phone,
      phoneNormalized: phone,
      firstName: 'New',
      lastName: 'Lead',
    }).run();

    const response = await request(app)
      .get(`/api/contacts/${contactId}/360`)
      .set('Authorization', `Bearer ${authA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('New Lead');
    expect(response.body.data.requirement).toBeNull();
    expect(response.body.data.timeline).toEqual([]);
    expect(response.body.data.calls).toEqual([]);
    expect(response.body.data.whatsappMessages).toEqual([]);
  });
});
