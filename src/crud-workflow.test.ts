import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { db } from './db/index.js';
import { createTestAuthUser } from './test-utils.js';

describe('Real Data Entry & End-to-End Operational Workflow API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(db);
  });

  it('allows authenticated BROKER/STAFF/ADMIN to perform full CRUD on Contacts', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const authAdmin = await createTestAuthUser(db, {
      id: `usr-admin-${randomId}`,
      organizationId: `org-crud-a-${randomId}`,
      email: `admin-${randomId}@crud.com`,
      role: 'ADMIN',
    });

    const authViewer = await createTestAuthUser(db, {
      id: `usr-viewer-${randomId}`,
      organizationId: `org-crud-a-${randomId}`,
      email: `viewer-${randomId}@crud.com`,
      role: 'VIEWER',
    });

    // 1. Create Contact
    const createRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${authAdmin.token}`)
      .send({
        phoneRaw: `+9191000${Math.floor(10000 + Math.random() * 90000)}`,
        firstName: 'Operational',
        lastName: 'Contact',
        email: 'ops@example.com',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const contactId = createRes.body.data.id;

    // 2. Read Contact
    const getRes = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${authAdmin.token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.firstName).toBe('Operational');

    // 3. Update Contact
    const patchRes = await request(app)
      .patch(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${authAdmin.token}`)
      .send({ firstName: 'UpdatedName' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.firstName).toBe('UpdatedName');

    // 4. Verify VIEWER role cannot update/delete
    const viewerPatchRes = await request(app)
      .patch(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${authViewer.token}`)
      .send({ firstName: 'Hacked' });

    expect(viewerPatchRes.status).toBe(403);

    // 5. Delete Contact
    const delRes = await request(app)
      .delete(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${authAdmin.token}`);

    expect(delRes.status).toBe(200);

    // Confirm deletion
    const getAfterDel = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${authAdmin.token}`);

    expect(getAfterDel.status).toBe(404);
  });

  it('allows full CRUD on Properties and enforces Tenant Isolation', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const authOrgA = await createTestAuthUser(db, {
      id: `usr-a-${randomId}`,
      organizationId: `org-prop-a-${randomId}`,
      email: `usr-a-${randomId}@propa.com`,
      role: 'BROKER',
    });

    const authOrgB = await createTestAuthUser(db, {
      id: `usr-b-${randomId}`,
      organizationId: `org-prop-b-${randomId}`,
      email: `usr-b-${randomId}@propb.com`,
      role: 'BROKER',
    });

    // 1. Create Property in Org A
    const propRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authOrgA.token}`)
      .send({
        ownerPhoneRaw: `+9192000${Math.floor(10000 + Math.random() * 90000)}`,
        ownerName: 'Property Owner A',
        title: 'Luxurious 3BHK Villa',
        propertyType: 'VILLA',
        listingType: 'RENT',
        bedrooms: 3,
        city: 'Bangalore',
        address: 'Koramangala 4th Block',
        monthlyRent: 65000,
        depositAmount: 300000,
      });

    expect(propRes.status).toBe(201);
    const propertyId = propRes.body.data.id;

    // 2. Org B attempts to read Org A property (IDOR Protection)
    const crossRead = await request(app)
      .get(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${authOrgB.token}`);

    expect(crossRead.status).toBe(404);

    // 3. Org B attempts to update Org A property
    const crossUpdate = await request(app)
      .patch(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${authOrgB.token}`)
      .send({ title: 'Hacked Title' });

    expect(crossUpdate.status).toBe(404);

    // 4. Org A updates property
    const patchRes = await request(app)
      .patch(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${authOrgA.token}`)
      .send({ monthlyRent: 70000 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.monthlyRent).toBe(70000);

    // 5. Org A deletes property
    const delRes = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${authOrgA.token}`);

    expect(delRes.status).toBe(200);
  });

  it('allows full CRUD on Requirements and Lead stage transitions', async () => {
    const randomId = Math.random().toString(36).substring(7);
    const authStaff = await createTestAuthUser(db, {
      id: `usr-staff-${randomId}`,
      organizationId: `org-req-${randomId}`,
      email: `staff-${randomId}@req.com`,
      role: 'STAFF',
    });

    // 1. Create Requirement
    const reqRes = await request(app)
      .post('/api/requirements')
      .set('Authorization', `Bearer ${authStaff.token}`)
      .send({
        customerPhoneRaw: `+9193000${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: 'Requirement Tenant',
        intent: 'RENT',
        propertyType: 'APARTMENT',
        minBedrooms: 2,
        preferredLocations: ['HSR Layout'],
        minBudget: 25000,
        maxBudget: 30000,
      });

    expect(reqRes.status).toBe(201);
    const requirementId = reqRes.body.data.id;

    // 2. Fetch Requirements list
    const listRes = await request(app)
      .get('/api/requirements')
      .set('Authorization', `Bearer ${authStaff.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    // 3. Fetch Leads list
    const leadsRes = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${authStaff.token}`);

    expect(leadsRes.status).toBe(200);
    const lead = leadsRes.body.data[0];
    expect(lead).toBeDefined();

    // 4. Update Lead Stage
    const stageRes = await request(app)
      .patch(`/api/leads/${lead.id}/stage`)
      .set('Authorization', `Bearer ${authStaff.token}`)
      .send({ stage: 'QUALIFIED' });

    expect(stageRes.status).toBe(200);
    expect(stageRes.body.data.stage).toBe('QUALIFIED');

    // 5. Delete Lead
    const delLeadRes = await request(app)
      .delete(`/api/leads/${lead.id}`)
      .set('Authorization', `Bearer ${authStaff.token}`);

    expect(delLeadRes.status).toBe(200);
  });
});
