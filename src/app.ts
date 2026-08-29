import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { DomainService } from './services/DomainService.js';
import { DashboardService } from './services/DashboardService.js';
import { MatchingEngine } from './matching/MatchingEngine.js';
import { createWhatsAppRouter } from './whatsapp/routes.js';
import { createAuthRouter } from './routes/auth.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { db as defaultDb } from './db/index.js';
import {
  CreateContactSchema,
  CreateCustomerSchema,
  CreateOwnerSchema,
  CreatePropertySchema,
  CreateRequirementSchema,
  UpdateLeadStageSchema,
  CreateInteractionSchema,
  IngestCallLogSchema,
  UploadAudioRecordingSchema,
  TelephonyWebhookSchema,
} from './schemas/validation.js';
import { CallIntelligenceService } from './services/CallIntelligenceService.js';

export function createApp(customDb = defaultDb) {
  const app = express();
  const domainService = new DomainService(customDb);
  const dashboardService = new DashboardService();
  const matchingEngine = new MatchingEngine();
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Health endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication Routes (PUBLIC & AUTHENTICATED)
  app.use('/api/auth', createAuthRouter(customDb));

  // External Webhooks & Integrations (Non-browser auth models)
  // WhatsApp Business Cloud API Integration Routes (Meta HMAC SHA-256 Auth)
  app.use('/api/whatsapp', createWhatsAppRouter(customDb));

  // Phase 9 Mode C: Cloud Telephony Webhook Ingestion Endpoint (Twilio / Exotel Webhook Auth)
  app.post('/api/calls/telephony-webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = TelephonyWebhookSchema.parse(req.body);
      const callIntelService = new CallIntelligenceService(customDb);

      const result = await callIntelService.processTelephonyWebhook(validated);

      if (result.status === 'DUPLICATE') {
        res.status(409).json({ success: false, error: 'Duplicate telephony webhook call SID', data: result.call });
        return;
      }

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // Phase 8: Ingest Call Log API Endpoint (Android Companion Bearer Token Auth)
  app.post('/api/calls/log', (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.COMPANION_API_TOKEN || 'app_sync_88192a';
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedToken) {
        res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing bearer token' });
        return;
      }

      const validated = IngestCallLogSchema.parse(req.body);

      const direction = validated.direction
        ? validated.direction
        : (validated.fromNumber.startsWith('+919999') || validated.fromNumber === 'System' ? 'OUTBOUND' : 'INBOUND');

      const targetPhone = direction === 'OUTBOUND' ? validated.toNumber : validated.fromNumber;

      const result = domainService.recordInteraction({
        phoneRaw: targetPhone,
        channel: 'CALL',
        direction: direction,
        summary: `${direction} call - ${validated.durationSeconds}s duration (${validated.callStatus})`,
        durationSeconds: validated.durationSeconds,
        senderPhone: validated.fromNumber,
        recipientPhone: validated.toNumber,
        externalCallSid: validated.externalCallSid,
        callStatus: validated.callStatus,
        deviceId: validated.deviceId,
      });

      if (result.status === 'DUPLICATE') {
        res.status(409).json({ success: false, error: 'Duplicate call record already ingested', data: result.call });
        return;
      }

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // =========================================================
  // PROTECTED CRM API ROUTES (Require Authentication & Tenant Isolation)
  // =========================================================
  const authMiddleware = requireAuth(customDb);

  // Customer 360 Aggregation Endpoints (Phase 10B)
  app.get('/api/customers/:id/360', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await dashboardService.getCustomer360Profile(id, customDb, req.organizationId);
      if (!profile) {
        res.status(404).json({ success: false, error: 'Customer 360 profile not found or unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/contacts/:id/360', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await dashboardService.getCustomer360Profile(id, customDb, req.organizationId);
      if (!profile) {
        res.status(404).json({ success: false, error: 'Contact 360 profile not found or unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  });

  // Dashboard Stats endpoint
  app.get('/api/dashboard/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await dashboardService.getStats(customDb, req.organizationId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  });

  // Phase 9 Mode B: Permitted User Audio Recording Upload Endpoint
  app.post('/api/calls/upload-recording', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = UploadAudioRecordingSchema.parse(req.body);
      const callIntelService = new CallIntelligenceService(customDb);

      const buffer = validated.audioBase64
        ? Buffer.from(validated.audioBase64, 'base64')
        : Buffer.from('mock_audio_content');

      const result = await callIntelService.processPermittedAudioUpload({
        phoneRaw: validated.phoneRaw,
        audioBuffer: buffer,
        filename: validated.filename,
        mimeType: validated.mimeType,
        userConsent: validated.userConsent,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // Contact Search endpoint
  app.get('/api/contacts/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || '';
      const results = await dashboardService.searchContacts(query, customDb, req.organizationId);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  });

  // Contact Detailed Profile endpoint
  app.get('/api/contacts/:id/details', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contactId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await dashboardService.getContactDetailedProfile(contactId, customDb, req.organizationId);
      if (!details) {
        res.status(404).json({ success: false, error: 'Contact not found' });
        return;
      }
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  });

  // Deterministic Matching API
  app.post('/api/matches/score', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requirement, property } = req.body;
      if (!requirement || !property) {
        res.status(400).json({ success: false, error: 'Both requirement and property objects are required' });
        return;
      }
      const scoreResult = matchingEngine.calculateMatchScore(requirement, property);
      res.status(200).json({ success: true, data: scoreResult });
    } catch (error) {
      next(error);
    }
  });

  // Contacts REST API
  app.post('/api/contacts', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateContactSchema.parse(req.body);
      const contact = domainService.createOrGetContact(validated.phoneRaw, validated, req.organizationId);
      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  });

  // Customers REST API
  app.post('/api/customers', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateCustomerSchema.parse(req.body);
      const customer = domainService.createCustomer({ ...validated, organizationId: req.organizationId });
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  });

  // Owners REST API
  app.post('/api/owners', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateOwnerSchema.parse(req.body);
      const owner = domainService.createOwner({ ...validated, organizationId: req.organizationId });
      res.status(201).json({ success: true, data: owner });
    } catch (error) {
      next(error);
    }
  });

  // Properties REST API
  app.get('/api/properties', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    try {
      const props = domainService['propertyRepo'].listProperties(req.organizationId, customDb);
      res.status(200).json({ success: true, data: props });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/properties', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreatePropertySchema.parse(req.body);
      const property = domainService.createProperty({ ...validated, organizationId: req.organizationId });
      res.status(201).json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  });

  // Requirements REST API
  app.get('/api/requirements', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqs = domainService['requirementRepo'].listRequirements(req.organizationId, customDb);
      res.status(200).json({ success: true, data: reqs });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/requirements', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateRequirementSchema.parse(req.body);
      const requirement = domainService.createRequirement({ ...validated, organizationId: req.organizationId });
      res.status(201).json({ success: true, data: requirement });
    } catch (error) {
      next(error);
    }
  });

  // Leads API: List Leads
  app.get('/api/leads', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadsList = domainService.listLeads(req.organizationId);
      res.status(200).json({ success: true, data: leadsList });
    } catch (error) {
      next(error);
    }
  });

  // Leads API: Transition Lead Stage (Phase 3 Pipeline)
  app.patch('/api/leads/:id/stage', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = UpdateLeadStageSchema.parse(req.body);
      const updatedLead = domainService.updateLeadStage(leadId, validated.stage, validated.lostReason, req.organizationId);
      if (!updatedLead) {
        res.status(404).json({ success: false, error: 'Lead not found or unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: updatedLead });
    } catch (error) {
      next(error);
    }
  });

  // Interactions REST API
  app.post('/api/interactions', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateInteractionSchema.parse(req.body);
      const interaction = domainService.recordInteraction({ ...validated, organizationId: req.organizationId });
      res.status(201).json({ success: true, data: interaction });
    } catch (error) {
      next(error);
    }
  });

  // Phase 7: Human Approval System Endpoints
  app.get('/api/reviews/pending', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const pending = domainService.getPendingReviews(req.organizationId);
      res.status(200).json({ success: true, data: pending });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/reviews/:id/approve', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const overrides = req.body;
      const approved = domainService.approveReview(id, overrides, req.organizationId);
      if (!approved) {
        res.status(404).json({ success: false, error: 'Pending review not found or unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: approved });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/reviews/:id/reject', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const rejected = domainService.rejectReview(id, req.organizationId);
      if (!rejected) {
        res.status(404).json({ success: false, error: 'Pending review not found or unauthorized' });
        return;
      }
      res.status(200).json({ success: true, data: rejected });
    } catch (error) {
      next(error);
    }
  });

  // Generic AI Extraction Pipeline Endpoint (Phase 6)
  app.post('/api/extract/pipeline', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rawInput, sourceIdentifier, providerName } = req.body;
      if (!rawInput) {
        res.status(400).json({ success: false, error: 'rawInput is required' });
        return;
      }
      const { AIPipeline } = await import('./ai/Pipeline.js');
      const pipeline = new AIPipeline();
      const result = await pipeline.processInput(rawInput, { sourceIdentifier, providerName });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // AI Extraction Endpoint
  app.post('/api/extract', authMiddleware, requireRole(['ADMIN', 'BROKER', 'STAFF']), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneRaw, inputText, providerName } = req.body;
      if (!phoneRaw || !inputText) {
        res.status(400).json({ success: false, error: 'phoneRaw and inputText are required' });
        return;
      }
      const result = await domainService.processUnstructuredInput(phoneRaw, inputText, providerName, req.organizationId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // Global Centralized Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: err.errors,
      });
      return;
    }

    logger.error({ err }, 'Unhandled application error');
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}
