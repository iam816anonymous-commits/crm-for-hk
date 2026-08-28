import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/index.js';
import { sourceRecords, requirements, contacts, messages, interactions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

describe('WhatsApp Integration Webhook API', () => {
  const app = createApp();

  it('GET /api/whatsapp/webhook - should verify Meta challenge token', async () => {
    const res = await request(app)
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'prop_crm_whatsapp_verify_token',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_ACCEPTED_123');
  });

  it('GET /api/whatsapp/webhook - should reject invalid verify token', async () => {
    const res = await request(app)
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/whatsapp/simulate - should process raw message "I need 2bhk in Whitefield below 25k" and retain source link', async () => {
    const rawMessageText = 'I need 2bhk in Whitefield below 25k';
    const testPhone = '+919876543210';

    const res = await request(app)
      .post('/api/whatsapp/simulate')
      .send({
        phone: testPhone,
        name: 'Ravi Kumar',
        message: rawMessageText,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const result = res.body.result;
    expect(result.sourceRecord).toBeDefined();
    expect(result.sourceRecord.sourceType).toBe('WHATSAPP');
    expect(result.sourceRecord.senderIdentifier).toBe(testPhone);

    // Verify raw message is preserved untouched in payload
    const rawPayload = JSON.parse(result.sourceRecord.payload);
    expect(rawPayload.text).toBe(rawMessageText);

    // Verify requirement references source_record_id
    expect(result.requirement).toBeDefined();
    expect(result.requirement.sourceRecordId).toBe(result.sourceRecord.id);
    expect(result.requirement.minBedrooms).toBe(2);
    expect(result.requirement.maxBudget).toBe(25000);
    expect(result.requirement.preferredLocations).toContain('Whitefield');

    // Verify database queries
    const storedSource = await db.select().from(sourceRecords).where(eq(sourceRecords.id, result.sourceRecord.id));
    expect(storedSource.length).toBe(1);
    expect(storedSource[0].payload).toContain(rawMessageText);

    const storedReq = await db.select().from(requirements).where(eq(requirements.id, result.requirement.id));
    expect(storedReq.length).toBe(1);
    expect(storedReq[0].sourceRecordId).toBe(result.sourceRecord.id);
  });
});
