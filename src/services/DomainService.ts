import { db } from '../db/index.js';
import { ContactRepository } from '../repositories/ContactRepository.js';
import { PropertyRepository, RequirementRepository, LeadRepository, InteractionRepository } from '../repositories/DomainRepositories.js';
import { ExtractionEngine } from '../ai/ExtractionEngine.js';
import { sourceRecords, extractionRuns, requirements, calls, auditLogs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class DomainService {
  private contactRepo = new ContactRepository();
  private propertyRepo = new PropertyRepository();
  private requirementRepo = new RequirementRepository();
  private leadRepo = new LeadRepository();
  private interactionRepo = new InteractionRepository();
  private aiEngine = new ExtractionEngine();
  private dbConn: any;

  constructor(customDb = db) {
    this.dbConn = customDb;
  }

  // Rule #1, 2, 3: Create or find canonical contact by phone number
  createOrGetContact(phoneRaw: string, data?: any, organizationId?: string) {
    return this.contactRepo.findOrCreateContact(phoneRaw, { ...data, organizationId }, this.dbConn);
  }

  upsertContact(data: { phoneRaw: string; firstName?: string; lastName?: string; email?: string; organizationId?: string }, dbOrTx = this.dbConn) {
    return this.contactRepo.findOrCreateContact(data.phoneRaw, data, dbOrTx);
  }

  ensureCustomerForContact(contactId: string, customerType = 'TENANT', organizationId?: string, dbOrTx = this.dbConn) {
    return this.contactRepo.getOrCreateCustomerRole(contactId, customerType, undefined, organizationId, dbOrTx);
  }

  // Rule #4: Create customer role linked to contact
  createCustomer(data: { phoneRaw?: string; contactId?: string; firstName?: string; lastName?: string; email?: string; customerType?: string; notes?: string; organizationId?: string }) {
    return this.dbConn.transaction((tx: any) => {
      let contactId = data.contactId;
      if (!contactId && data.phoneRaw) {
        const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, { firstName: data.firstName, lastName: data.lastName, email: data.email, organizationId: data.organizationId }, tx);
        contactId = contact.id;
      }
      if (!contactId) {
        throw new Error('Contact ID or valid phone number is required to create a customer.');
      }
      return this.contactRepo.getOrCreateCustomerRole(contactId, data.customerType || 'TENANT', data.notes, data.organizationId, tx);
    });
  }

  // Rule #4 & 5: Create owner role and property
  createOwner(data: { phoneRaw?: string; contactId?: string; firstName?: string; lastName?: string; email?: string; taxId?: string; companyName?: string; notes?: string; organizationId?: string }) {
    return this.dbConn.transaction((tx: any) => {
      let contactId = data.contactId;
      if (!contactId && data.phoneRaw) {
        const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, { firstName: data.firstName, lastName: data.lastName, email: data.email, organizationId: data.organizationId }, tx);
        contactId = contact.id;
      }
      if (!contactId) {
        throw new Error('Contact ID or valid phone number is required to create an owner.');
      }
      return this.contactRepo.getOrCreateOwnerRole(contactId, data.taxId, data.companyName, data.notes, data.organizationId, tx);
    });
  }

  // Rule #5: Phase 3 Create property belonging to owner
  createProperty(propertyData: any) {
    return this.dbConn.transaction((tx: any) => {
      let ownerId = propertyData.ownerId;
      if (!ownerId && propertyData.ownerPhoneRaw) {
        const ownerRole = this.createOwner({
          phoneRaw: propertyData.ownerPhoneRaw,
          firstName: propertyData.ownerName || 'Owner',
          organizationId: propertyData.organizationId,
        });
        ownerId = ownerRole.id;
      }
      if (!ownerId) {
        throw new Error('Owner ID or valid Owner Phone Number is required.');
      }

      return this.propertyRepo.createProperty({
        ...propertyData,
        ownerId,
        organizationId: propertyData.organizationId || null,
      }, tx);
    });
  }

  // Rule #6: Phase 3 Create requirement belonging to customer
  createRequirement(requirementData: any) {
    return this.dbConn.transaction((tx: any) => {
      let customerId = requirementData.customerId;
      if (!customerId && requirementData.customerPhoneRaw) {
        const customerRole = this.createCustomer({
          phoneRaw: requirementData.customerPhoneRaw,
          firstName: requirementData.customerName || 'Customer',
          organizationId: requirementData.organizationId,
        });
        customerId = customerRole.id;
      }
      if (!customerId) {
        throw new Error('Customer ID or valid Customer Phone Number is required.');
      }

      const req = this.requirementRepo.createRequirement({
        ...requirementData,
        customerId,
        organizationId: requirementData.organizationId || null,
      }, tx);

      // Auto-create initial Lead record for pipeline tracking
      this.leadRepo.createLead({
        customerId,
        requirementId: req.id,
        stage: 'NEW',
        organizationId: requirementData.organizationId || null,
      }, tx);

      return req;
    });
  }

  // Phase 3 Lead Stage Transition
  updateLeadStage(leadId: string, stage: string, lostReason?: string, organizationId?: string) {
    return this.leadRepo.updateLeadStage(leadId, stage, lostReason, organizationId, this.dbConn);
  }

  listLeads(organizationId?: string) {
    return this.leadRepo.listLeads(organizationId, this.dbConn);
  }

  // Rule #7 & Phase 8: Record interaction (call or message) with duplicate prevention and audit trail
  recordInteraction(data: { phoneRaw: string; channel: string; direction: string; summary?: string; body?: string; durationSeconds?: number; senderPhone?: string; recipientPhone?: string; externalCallSid?: string; callStatus?: string; deviceId?: string; organizationId?: string }) {
    return this.dbConn.transaction((tx: any) => {
      // Deduplication check if externalCallSid is provided
      if (data.externalCallSid) {
        const existingCall = tx.select().from(calls).where(eq(calls.externalCallSid, data.externalCallSid)).get();
        if (existingCall) {
          return { status: 'DUPLICATE', call: existingCall };
        }
      }

      const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, { organizationId: data.organizationId }, tx);
      const contactId = contact.id;

      const detailData = data.channel === 'CALL' ? {
        type: 'call' as const,
        payload: {
          externalCallSid: data.externalCallSid,
          fromNumber: data.senderPhone || data.phoneRaw,
          toNumber: data.recipientPhone || 'System',
          durationSeconds: data.durationSeconds || 0,
          callStatus: data.callStatus || 'COMPLETED',
          deviceId: data.deviceId,
        }
      } : {
        type: 'message' as const,
        payload: {
          senderPhone: data.senderPhone || data.phoneRaw,
          recipientPhone: data.recipientPhone || 'System',
          body: data.body || data.summary,
        }
      };

      const interactionResult = this.interactionRepo.createInteraction({
        organizationId: data.organizationId || null,
        contactId,
        channel: data.channel,
        direction: data.direction,
        summary: data.summary || data.body,
      }, detailData, tx);

      // Audit Log for Call Ingestion
      tx.insert(auditLogs).values({
        organizationId: data.organizationId || null,
        tableName: 'calls',
        recordId: interactionResult.id,
        action: 'INSERT',
        performedBy: 'ANDROID_COMPANION_APP',
        newValues: JSON.stringify({
          phoneRaw: data.phoneRaw,
          externalCallSid: data.externalCallSid,
          channel: data.channel,
          direction: data.direction,
          durationSeconds: data.durationSeconds,
          callStatus: data.callStatus,
        }),
      }).run();

      return { status: 'CREATED', ...interactionResult };
    });
  }

  // Rule #8, 9, 10: Process text extraction preserving source record & confidence without overwriting verified info
  async processUnstructuredInput(phoneRaw: string, inputText: string, providerName?: any, organizationId?: string) {
    const extraction = await this.aiEngine.extract(inputText, providerName);

    return this.dbConn.transaction((tx: any) => {
      const contact = this.contactRepo.findOrCreateContact(phoneRaw, { organizationId }, tx);
      const customer = this.contactRepo.getOrCreateCustomerRole(contact.id, 'TENANT', undefined, organizationId, tx);

      const [sourceRec] = tx.insert(sourceRecords).values({
        organizationId: organizationId || null,
        sourceType: 'MANUAL',
        senderIdentifier: phoneRaw,
        payload: JSON.stringify({ inputText }),
      }).returning().all();

      const [extractionRun] = tx.insert(extractionRuns).values({
        sourceRecordId: sourceRec.id,
        providerName: extraction.providerName,
        modelName: extraction.modelName,
        overallConfidence: extraction.confidenceScore,
        rawExtractionResult: JSON.stringify(extraction.rawResponse),
        status: extraction.confidenceScore >= 0.85 ? 'AUTO_COMMITTED' : 'PENDING_HUMAN_REVIEW',
      }).returning().all();

      const existingReq = tx.select().from(requirements).where(eq(requirements.customerId, customer.id)).get();

      if (existingReq && existingReq.isVerifiedManually) {
        return {
          contact,
          customer,
          sourceRecord: sourceRec,
          extractionRun,
          status: 'SKIPPED_MANUAL_VERIFIED',
          requirement: existingReq,
        };
      }

      const reqData = {
        organizationId: organizationId || null,
        customerId: customer.id,
        intent: extraction.requirement?.intent || 'RENT',
        propertyType: extraction.requirement?.propertyType,
        minBedrooms: extraction.requirement?.minBedrooms,
        minBudget: extraction.requirement?.minBudget,
        maxBudget: extraction.requirement?.maxBudget,
        notes: extraction.requirement?.notes || inputText,
        sourceRecordId: sourceRec.id,
        extractionConfidence: extraction.confidenceScore,
      };

      const requirement = this.requirementRepo.createRequirement(reqData, tx);

      return {
        contact,
        customer,
        sourceRecord: sourceRec,
        extractionRun,
        status: 'SUCCESS',
        requirement,
      };
    });
  }

  // Extended CRUD methods for Contacts
  getContact(id: string, organizationId?: string) {
    return this.contactRepo.getContact(id, organizationId, this.dbConn);
  }

  updateContact(id: string, data: any, organizationId?: string) {
    return this.contactRepo.updateContact(id, data, organizationId, this.dbConn);
  }

  deleteContact(id: string, organizationId?: string) {
    return this.contactRepo.deleteContact(id, organizationId, this.dbConn);
  }

  // Extended CRUD methods for Properties
  getProperty(id: string, organizationId?: string) {
    return this.propertyRepo.getPropertyById(id, organizationId, this.dbConn);
  }

  updateProperty(id: string, updates: any, organizationId?: string) {
    return this.propertyRepo.updateProperty(id, updates, organizationId, this.dbConn);
  }

  deleteProperty(id: string, organizationId?: string) {
    return this.propertyRepo.deleteProperty(id, organizationId, this.dbConn);
  }

  // Extended CRUD methods for Requirements
  getRequirement(id: string, organizationId?: string) {
    return this.requirementRepo.getRequirementById(id, organizationId, this.dbConn);
  }

  updateRequirement(id: string, updates: any, organizationId?: string) {
    return this.requirementRepo.updateRequirement(id, updates, organizationId, this.dbConn);
  }

  deleteRequirement(id: string, organizationId?: string) {
    return this.requirementRepo.deleteRequirement(id, organizationId, this.dbConn);
  }

  // Extended CRUD methods for Leads
  getLead(id: string, organizationId?: string) {
    return this.leadRepo.getLeadById(id, organizationId, this.dbConn);
  }

  deleteLead(id: string, organizationId?: string) {
    return this.leadRepo.deleteLead(id, organizationId, this.dbConn);
  }

  // Phase 7: Human Approval System methods
  getPendingReviews(organizationId?: string) {
    let query = this.dbConn.select({
      requirement: requirements,
      extractionRun: extractionRuns,
    })
    .from(requirements)
    .leftJoin(extractionRuns, eq(requirements.sourceRecordId, extractionRuns.sourceRecordId))
    .where(eq(requirements.isVerifiedManually, false));

    if (organizationId) {
      query = query.where(and(eq(requirements.isVerifiedManually, false), eq(requirements.organizationId, organizationId)));
    }

    return query.all();
  }

  approveReview(requirementId: string, overrides?: Partial<typeof requirements.$inferInsert>, organizationId?: string) {
    return this.dbConn.transaction((tx: any) => {
      if (organizationId) {
        const existing = tx.select().from(requirements).where(and(eq(requirements.id, requirementId), eq(requirements.organizationId, organizationId))).get();
        if (!existing) return null;
      }

      const [updated] = tx.update(requirements)
        .set({
          ...overrides,
          isVerifiedManually: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(requirements.id, requirementId))
        .returning()
        .all();

      return updated;
    });
  }

  rejectReview(requirementId: string, organizationId?: string) {
    return this.dbConn.transaction((tx: any) => {
      if (organizationId) {
        const existing = tx.select().from(requirements).where(and(eq(requirements.id, requirementId), eq(requirements.organizationId, organizationId))).get();
        if (!existing) return null;
      }

      const [updated] = tx.update(requirements)
        .set({
          isActive: false,
          isVerifiedManually: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(requirements.id, requirementId))
        .returning()
        .all();

      return updated;
    });
  }
}
