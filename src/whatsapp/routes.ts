import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { WhatsAppService } from './WhatsAppService.js';
import { db as defaultDb } from '../db/index.js';
import { sourceRecords, messages, requirements } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export function createWhatsAppRouter(customDb = defaultDb) {
  const router = Router();
  const whatsappService = new WhatsAppService(customDb);

  // HMAC Signature verification helper
  function verifyMetaSignature(req: Request): boolean {
    const signature = req.headers['x-hub-signature-256'] as string;
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret || !signature) {
      // Return true in development/test if secret is not configured
      return true;
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

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
      // 1. Signature Verification
      if (!verifyMetaSignature(req)) {
        return res.status(401).json({ error: 'Invalid X-Hub-Signature-256 signature' });
      }

      const payload = req.body;

      // 2. Process payload idempotently & transaction-safely
      const results = await whatsappService.processMetaWebhook(payload);

      // 3. Always return 200 OK to acknowledge Meta Webhook delivery within 3 seconds
      return res.status(200).json({ status: 'success', processed: results.length, data: results });
    } catch (error: any) {
      req.log?.error(error);
      // Return 200 OK even on soft errors to prevent Meta delivery block, while logging internal failure
      return res.status(200).json({ status: 'acknowledged_with_error', error: error.message });
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
      const rawRecords = await customDb
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
      const reqs = await customDb.select().from(requirements);

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

  return router;
}

export default createWhatsAppRouter();
