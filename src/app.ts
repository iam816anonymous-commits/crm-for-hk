import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { DomainService } from './services/DomainService.js';
import { DashboardService } from './services/DashboardService.js';
import { MatchingEngine } from './matching/MatchingEngine.js';
import { db as defaultDb } from './db/index.js';
import {
  CreateContactSchema,
  CreateCustomerSchema,
  CreateOwnerSchema,
  CreatePropertySchema,
  CreateRequirementSchema,
  UpdateLeadStageSchema,
  CreateInteractionSchema,
} from './schemas/validation.js';

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

  // Dashboard Stats endpoint
  app.get('/api/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await dashboardService.getStats(customDb);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  });

  // Contact Search endpoint
  app.get('/api/contacts/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || '';
      const results = await dashboardService.searchContacts(query, customDb);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  });

  // Contact Detailed Profile endpoint
  app.get('/api/contacts/:id/details', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contactId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await dashboardService.getContactDetailedProfile(contactId, customDb);
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
  app.post('/api/matches/score', (req: Request, res: Response, next: NextFunction) => {
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
  app.post('/api/contacts', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateContactSchema.parse(req.body);
      const contact = domainService.createOrGetContact(validated.phoneRaw, validated);
      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  });

  // Customers REST API
  app.post('/api/customers', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateCustomerSchema.parse(req.body);
      const customer = domainService.createCustomer(validated);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  });

  // Owners REST API
  app.post('/api/owners', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateOwnerSchema.parse(req.body);
      const owner = domainService.createOwner(validated);
      res.status(201).json({ success: true, data: owner });
    } catch (error) {
      next(error);
    }
  });

  // Properties REST API
  app.post('/api/properties', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreatePropertySchema.parse(req.body);
      const property = domainService.createProperty(validated);
      res.status(201).json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  });

  // Requirements REST API
  app.post('/api/requirements', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateRequirementSchema.parse(req.body);
      const requirement = domainService.createRequirement(validated);
      res.status(201).json({ success: true, data: requirement });
    } catch (error) {
      next(error);
    }
  });

  // Leads API: List Leads
  app.get('/api/leads', (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadsList = domainService.listLeads();
      res.status(200).json({ success: true, data: leadsList });
    } catch (error) {
      next(error);
    }
  });

  // Leads API: Transition Lead Stage (Phase 3 Pipeline)
  app.patch('/api/leads/:id/stage', (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = UpdateLeadStageSchema.parse(req.body);
      const updatedLead = domainService.updateLeadStage(leadId, validated.stage, validated.lostReason);
      res.status(200).json({ success: true, data: updatedLead });
    } catch (error) {
      next(error);
    }
  });

  // Interactions REST API
  app.post('/api/interactions', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateInteractionSchema.parse(req.body);
      const interaction = domainService.recordInteraction(validated);
      res.status(201).json({ success: true, data: interaction });
    } catch (error) {
      next(error);
    }
  });

  // AI Extraction Endpoint
  app.post('/api/extract', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneRaw, inputText, providerName } = req.body;
      if (!phoneRaw || !inputText) {
        res.status(400).json({ success: false, error: 'phoneRaw and inputText are required' });
        return;
      }
      const result = await domainService.processUnstructuredInput(phoneRaw, inputText, providerName);
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
