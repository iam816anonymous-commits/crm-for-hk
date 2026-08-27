import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { DomainService } from './services/DomainService.js';
import { db as defaultDb } from './db/index.js';
import {
  CreateContactSchema,
  CreateCustomerSchema,
  CreateOwnerSchema,
  CreatePropertySchema,
  CreateRequirementSchema,
  CreateInteractionSchema,
} from './schemas/validation.js';

export function createApp(customDb = defaultDb) {
  const app = express();
  const domainService = new DomainService(customDb);
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Health endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
