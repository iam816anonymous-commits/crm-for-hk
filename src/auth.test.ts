import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { organizations, users, contacts, properties } from './db/schema.js';
import { eq } from 'drizzle-orm';

describe('Phase 10: Authentication, Authorization, RBAC & Tenant Isolation', () => {
  let app: any;
  let testDbConn: any;

  beforeEach(() => {
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);
  });

  it('allows registering a new organization and logging in', async () => {
    const regRes = await request(app)
      .post('/api/auth/register-org')
      .send({
        organizationName: 'Acme Realty',
        fullName: 'Admin User',
        email: 'admin@acme.com',
        password: 'Password123!',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.user.role).toBe('ADMIN');

    // Login test
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@acme.com',
        password: 'Password123!',
      });

    if (loginRes.status !== 200) {
      console.error('LOGIN FAILED BODY:', loginRes.body);
    }

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // /api/auth/me test
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('admin@acme.com');
  });

  it('rejects invalid passwords during login', async () => {
    await request(app)
      .post('/api/auth/register-org')
      .send({
        organizationName: 'Acme Realty',
        fullName: 'Admin User',
        email: 'admin@acme.com',
        password: 'Password123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@acme.com',
        password: 'WrongPassword!',
      });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });

  it('enforces RBAC for invitation creation (ADMIN only)', async () => {
    // 1. Register Org & ADMIN
    const adminReg = await request(app)
      .post('/api/auth/register-org')
      .send({
        organizationName: 'Acme Realty',
        fullName: 'Admin User',
        email: 'admin@acme.com',
        password: 'Password123!',
      });
    const adminToken = adminReg.body.token;

    // 2. Admin invites a VIEWER
    const inviteRes = await request(app)
      .post('/api/auth/invitation')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'viewer@acme.com',
        role: 'VIEWER',
      });

    expect(inviteRes.status).toBe(201);
    const inviteToken = inviteRes.body.invitation.token;

    // 3. Viewer accepts invitation
    const acceptRes = await request(app)
      .post('/api/auth/accept-invitation')
      .send({
        token: inviteToken,
        fullName: 'Viewer Person',
        password: 'Password123!',
      });

    expect(acceptRes.status).toBe(201);
    const viewerToken = acceptRes.body.token;

    // 4. Viewer tries to create another invitation -> REJECTED (403 Forbidden)
    const forbiddenInvite = await request(app)
      .post('/api/auth/invitation')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        email: 'other@acme.com',
        role: 'STAFF',
      });

    expect(forbiddenInvite.status).toBe(403);

    // 5. Viewer tries to write a contact -> REJECTED (403 Forbidden)
    const writeContactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        phoneRaw: '+919999888777',
        firstName: 'Blocked Contact',
      });

    expect(writeContactRes.status).toBe(403);
  });

  it('enforces strict Tenant Isolation between Organization A and Organization B', async () => {
    // Register Org A
    const orgAReg = await request(app)
      .post('/api/auth/register-org')
      .send({
        organizationName: 'Org A',
        fullName: 'Broker A',
        email: 'brokera@orga.com',
        password: 'Password123!',
      });
    const tokenA = orgAReg.body.token;

    // Register Org B
    const orgBReg = await request(app)
      .post('/api/auth/register-org')
      .send({
        organizationName: 'Org B',
        fullName: 'Broker B',
        email: 'brokerb@orgb.com',
        password: 'Password123!',
      });
    const tokenB = orgBReg.body.token;

    // Org A creates a contact
    const contactARes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        phoneRaw: '+919111111111',
        firstName: 'Secret Org A Contact',
      });

    expect(contactARes.status).toBe(201);
    const contactAId = contactARes.body.data.id;

    // Org B attempts to fetch Org A contact details -> 404 / Not Found (IDOR Protected)
    const idorRes = await request(app)
      .get(`/api/contacts/${contactAId}/details`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(idorRes.status).toBe(404);

    // Org B searches contacts -> Org A contact must NOT appear
    const searchRes = await request(app)
      .get('/api/contacts/search?q=Secret')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(0);
  });
});
