import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './db/schema.js';
import { eq } from 'drizzle-orm';

describe('Phase 8: Android Call Sync & Ingestion API Integration Tests', () => {
  let app: any;
  let testDbConn: any;
  const validToken = 'app_sync_88192a';

  beforeEach(() => {
    testDbConn = createDbConnection(':memory:');
    migrate(testDbConn.db, { migrationsFolder: './drizzle' });
    app = createApp(testDbConn.db);
  });

  it('rejects unauthenticated requests missing bearer token with 401', async () => {
    const res = await request(app)
      .post('/api/calls/log')
      .send({
        externalCallSid: 'test_sid_001',
        fromNumber: '+919876543210',
        toNumber: '+919999999999',
        durationSeconds: 120,
        callStatus: 'COMPLETED',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('rejects request with invalid bearer token with 401', async () => {
    const res = await request(app)
      .post('/api/calls/log')
      .set('Authorization', 'Bearer invalid_token')
      .send({
        externalCallSid: 'test_sid_001',
        fromNumber: '+919876543210',
        toNumber: '+919999999999',
        durationSeconds: 120,
        callStatus: 'COMPLETED',
      });

    expect(res.status).toBe(401);
  });

  it('rejects malformed payloads with 400 validation error', async () => {
    const res = await request(app)
      .post('/api/calls/log')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        externalCallSid: '', // Empty SID invalid
        fromNumber: '123', // Short number
        callStatus: 'UNKNOWN_STATUS', // Invalid enum
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('successfully ingests valid inbound call log and creates contact/audit entry', async () => {
    const payload = {
      externalCallSid: 'sid_inbound_1001',
      fromNumber: '+919876543210',
      toNumber: '+919999999999',
      durationSeconds: 252,
      callStatus: 'COMPLETED',
      timestampMs: Date.now(),
      deviceId: 'android_device_001',
    };

    const res = await request(app)
      .post('/api/calls/log')
      .set('Authorization', `Bearer ${validToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify contact creation
    const createdContact = testDbConn.db.select().from(schema.contacts).where(eq(schema.contacts.phoneNormalized, '+919876543210')).get();
    expect(createdContact).toBeDefined();

    // Verify audit log creation
    const auditRecord = testDbConn.db.select().from(schema.auditLogs).where(eq(schema.auditLogs.tableName, 'calls')).get();
    expect(auditRecord).toBeDefined();
    expect(auditRecord.performedBy).toBe('ANDROID_COMPANION_APP');
  });

  it('suppresses duplicate calls with 409 Conflict status', async () => {
    const payload = {
      externalCallSid: 'sid_duplicate_test_999',
      fromNumber: '+919812345678',
      toNumber: '+919999999999',
      durationSeconds: 165,
      callStatus: 'COMPLETED',
    };

    // First Ingestion
    const res1 = await request(app)
      .post('/api/calls/log')
      .set('Authorization', `Bearer ${validToken}`)
      .send(payload);

    expect(res1.status).toBe(201);

    // Second Ingestion (Duplicate)
    const res2 = await request(app)
      .post('/api/calls/log')
      .set('Authorization', `Bearer ${validToken}`)
      .send(payload);

    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain('Duplicate call record already ingested');
  });

  it('correctly maps outgoing calls based on system device number', async () => {
    const payload = {
      externalCallSid: 'sid_outbound_2002',
      fromNumber: '+919999999999',
      toNumber: '+919765432109',
      durationSeconds: 380,
      callStatus: 'COMPLETED',
    };

    const res = await request(app)
      .post('/api/calls/log')
      .set('Authorization', `Bearer ${validToken}`)
      .send(payload);

    expect(res.status).toBe(201);

    const contact = testDbConn.db.select().from(schema.contacts).where(eq(schema.contacts.phoneNormalized, '+919765432109')).get();
    expect(contact).toBeDefined();
  });
});
