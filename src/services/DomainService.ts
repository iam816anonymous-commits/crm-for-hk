import { db } from '../db/index.js';
import { ContactRepository } from '../repositories/ContactRepository.js';
import { PropertyRepository, RequirementRepository, LeadRepository, InteractionRepository } from '../repositories/DomainRepositories.js';
import { ExtractionEngine } from '../ai/ExtractionEngine.js';
import { sourceRecords, extractionRuns, requirements } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
  createOrGetContact(phoneRaw: string, data?: any) {
    return this.contactRepo.findOrCreateContact(phoneRaw, data, this.dbConn);
  }

  upsertContact(data: { phoneRaw: string; firstName?: string; lastName?: string; email?: string }, dbOrTx = this.dbConn) {
    return this.contactRepo.findOrCreateContact(data.phoneRaw, data, dbOrTx);
  }

  ensureCustomerForContact(contactId: string, customerType = 'TENANT', dbOrTx = this.dbConn) {
    return this.contactRepo.getOrCreateCustomerRole(contactId, customerType, undefined, dbOrTx);
  }

  // Rule #4: Create customer role linked to contact
  createCustomer(data: { phoneRaw?: string; contactId?: string; firstName?: string; lastName?: string; email?: string; customerType?: string; notes?: string }) {
    return this.dbConn.transaction((tx: any) => {
      let contactId = data.contactId;
      if (!contactId && data.phoneRaw) {
        const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, { firstName: data.firstName, lastName: data.lastName, email: data.email }, tx);
        contactId = contact.id;
      }
      if (!contactId) {
        throw new Error('Contact ID or valid phone number is required to create a customer.');
      }
      return this.contactRepo.getOrCreateCustomerRole(contactId, data.customerType || 'TENANT', data.notes, tx);
    });
  }

  // Rule #4 & 5: Create owner role and property
  createOwner(data: { phoneRaw?: string; contactId?: string; firstName?: string; lastName?: string; email?: string; taxId?: string; companyName?: string; notes?: string }) {
    return this.dbConn.transaction((tx: any) => {
      let contactId = data.contactId;
      if (!contactId && data.phoneRaw) {
        const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, { firstName: data.firstName, lastName: data.lastName, email: data.email }, tx);
        contactId = contact.id;
      }
      if (!contactId) {
        throw new Error('Contact ID or valid phone number is required to create an owner.');
      }
      return this.contactRepo.getOrCreateOwnerRole(contactId, data.taxId, data.companyName, data.notes, tx);
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
        });
        ownerId = ownerRole.id;
      }
      if (!ownerId) {
        throw new Error('Owner ID or valid Owner Phone Number is required.');
      }

      return this.propertyRepo.createProperty({
        ...propertyData,
        ownerId,
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
        });
        customerId = customerRole.id;
      }
      if (!customerId) {
        throw new Error('Customer ID or valid Customer Phone Number is required.');
      }

      const req = this.requirementRepo.createRequirement({
        ...requirementData,
        customerId,
      }, tx);

      // Auto-create initial Lead record for pipeline tracking
      this.leadRepo.createLead({
        customerId,
        requirementId: req.id,
        stage: 'NEW',
      }, tx);

      return req;
    });
  }

  // Phase 3 Lead Stage Transition
  updateLeadStage(leadId: string, stage: string, lostReason?: string) {
    return this.leadRepo.updateLeadStage(leadId, stage, lostReason, this.dbConn);
  }

  listLeads() {
    return this.leadRepo.listLeads(this.dbConn);
  }

  // Rule #7: Record interaction (call or message)
  recordInteraction(data: { phoneRaw: string; channel: string; direction: string; summary?: string; body?: string; durationSeconds?: number; senderPhone?: string; recipientPhone?: string }) {
    return this.dbConn.transaction((tx: any) => {
      const contact = this.contactRepo.findOrCreateContact(data.phoneRaw, {}, tx);
      const contactId = contact.id;

      const detailData = data.channel === 'CALL' ? {
        type: 'call' as const,
        payload: {
          fromNumber: data.senderPhone || data.phoneRaw,
          toNumber: data.recipientPhone || 'System',
          durationSeconds: data.durationSeconds || 0,
          callStatus: 'COMPLETED',
        }
      } : {
        type: 'message' as const,
        payload: {
          senderPhone: data.senderPhone || data.phoneRaw,
          recipientPhone: data.recipientPhone || 'System',
          body: data.body || data.summary,
        }
      };

      return this.interactionRepo.createInteraction({
        contactId,
        channel: data.channel,
        direction: data.direction,
        summary: data.summary || data.body,
      }, detailData, tx);
    });
  }

  // Rule #8, 9, 10: Process text extraction preserving source record & confidence without overwriting verified info
  async processUnstructuredInput(phoneRaw: string, inputText: string, providerName?: any) {
    const extraction = await this.aiEngine.extract(inputText, providerName);

    return this.dbConn.transaction((tx: any) => {
      const contact = this.contactRepo.findOrCreateContact(phoneRaw, {}, tx);
      const customer = this.contactRepo.getOrCreateCustomerRole(contact.id, 'TENANT', undefined, tx);

      const [sourceRec] = tx.insert(sourceRecords).values({
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
}
