import { Router } from 'express';
import { WhatsAppService } from './WhatsAppService.js';
import { db } from '../db/index.js';
import { sourceRecords, messages, requirements, contacts } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();
const whatsappService = new WhatsAppService();

// GET /api/whatsapp/webhook - Meta verification handshake
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = whatsappService.verifyWebhook(mode, token, challenge);
  if (result.success && result.challenge) {
    return res.status(200).send(result.challenge);
  } else {
    return res.status(403).json({ error: 'Verification failed' });
  }
});

// POST /api/whatsapp/webhook - Inbound webhook payload from Meta Cloud API
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const results = await whatsappService.processMetaWebhook(payload);
    return res.status(200).json({ status: 'success', processed: results.length, data: results });
  } catch (error: any) {
    req.log?.error(error);
    return res.status(500).json({ error: error.message || 'Failed to process WhatsApp webhook' });
  }
});

// POST /api/whatsapp/simulate - Direct message simulation endpoint for testing
router.post('/simulate', async (req, res) => {
  try {
    const { phone, name, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    const result = await whatsappService.processInboundMessage({
      senderPhone: phone,
      senderName: name || 'WhatsApp Simulation User',
      messageText: message,
    });

    return res.status(201).json({ success: true, result });
  } catch (error: any) {
    req.log?.error(error);
    return res.status(500).json({ error: error.message || 'Failed to simulate WhatsApp message' });
  }
});

// GET /api/whatsapp/messages - Retrieve ingested messages with raw payloads & extracted requirements
router.get('/messages', async (_req, res) => {
  try {
    const rawRecords = await db
      .select({
        sourceRecord: sourceRecords,
        interactionId: messages.interactionId,
        senderPhone: messages.senderPhone,
        messageBody: messages.body,
        messageStatus: messages.status,
      })
      .from(sourceRecords)
      .leftJoin(messages, eq(sourceRecords.externalId, messages.externalId))
      .where(eq(sourceRecords.sourceType, 'WHATSAPP'))
      .orderBy(desc(sourceRecords.createdAt));

    // Also load linked requirements
    const reqs = await db.select().from(requirements);

    const formatted = rawRecords.map(item => {
      const linkedReq = reqs.find(r => r.sourceRecordId === item.sourceRecord.id);
      return {
        id: item.sourceRecord.id,
        externalId: item.sourceRecord.externalId,
        senderPhone: item.senderPhone || item.sourceRecord.senderIdentifier,
        rawPayload: item.sourceRecord.payload,
        messageBody: item.messageBody,
        createdAt: item.sourceRecord.createdAt,
        extractedRequirement: linkedReq ? {
          id: linkedReq.id,
          intent: linkedReq.intent,
          propertyType: linkedReq.propertyType,
          minBedrooms: linkedReq.minBedrooms,
          preferredLocations: linkedReq.preferredLocations ? JSON.parse(linkedReq.preferredLocations) : [],
          maxBudget: linkedReq.maxBudget,
          extractionConfidence: linkedReq.extractionConfidence,
        } : null,
      };
    });

    return res.json({ messages: formatted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
