import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createDbConnection } from './db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './db/schema.js';
import { eq } from 'drizzle-orm';
import { createTestAuthUser } from './test-utils.js';

describe('Phase 9: Call Intelligence, STT & Permitted Audio Upload API Integration Tests', () => {
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

  it('rejects permitted audio recording upload without explicit user consent', async () => {
    const res = await request(app)
      .post('/api/calls/upload-recording')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '+919876543210',
        filename: 'meeting.mp3',
        userConsent: false, // Disallowed without user consent
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('successfully processes Mode B permitted audio upload, runs STT transcription and creates pending review entry', async () => {
    const res = await request(app)
      .post('/api/calls/upload-recording')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phoneRaw: '+919876543210',
        filename: 'client_call_recording.mp3',
        mimeType: 'audio/mpeg',
        userConsent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcript).toContain('Ravi Kumar');
    expect(res.body.data.call.transcript).toBeDefined();

    // Verify contact creation
    const contact = testDbConn.db.select().from(schema.contacts).where(eq(schema.contacts.phoneNormalized, '+919876543210')).get();
    expect(contact).toBeDefined();

    // Verify requirement created and routed to Human Approval Review Queue
    const requirement = testDbConn.db.select().from(schema.requirements).where(eq(schema.requirements.sourceRecordId, res.body.data.sourceRecord.id)).get();
    expect(requirement).toBeDefined();
    expect(requirement.isVerifiedManually).toBe(false); // Pending Human Review
  });

  it('successfully ingests Mode C Cloud Telephony Webhook (Twilio / Exotel)', async () => {
    const webhookPayload = {
      callSid: 'CA_twilio_call_1001',
      fromNumber: '+919812345678',
      toNumber: '+919999999999',
      durationSeconds: 180,
      recordingUrl: 'https://api.twilio.com/recordings/RE123.mp3',
      callStatus: 'COMPLETED',
    };

    const res = await request(app)
      .post('/api/calls/telephony-webhook')
      .send(webhookPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.call.externalCallSid).toBe('CA_twilio_call_1001');

    // Verify contact creation
    const contact = testDbConn.db.select().from(schema.contacts).where(eq(schema.contacts.phoneNormalized, '+919812345678')).get();
    expect(contact).toBeDefined();
  });

  it('suppresses duplicate telephony webhook call SIDs with 409 Conflict', async () => {
    const webhookPayload = {
      callSid: 'CA_duplicate_sid_999',
      fromNumber: '+919765432109',
      toNumber: '+919999999999',
      durationSeconds: 120,
      callStatus: 'COMPLETED',
    };

    // First Webhook Ingestion
    const res1 = await request(app)
      .post('/api/calls/telephony-webhook')
      .send(webhookPayload);

    expect(res1.status).toBe(201);

    // Second Duplicate Ingestion
    const res2 = await request(app)
      .post('/api/calls/telephony-webhook')
      .send(webhookPayload);

    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain('Duplicate telephony webhook call SID');
  });
});
