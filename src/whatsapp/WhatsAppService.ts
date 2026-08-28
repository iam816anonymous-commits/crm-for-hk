import { db } from '../db/index.js';
import { sourceRecords, interactions, messages, requirements, extractionRuns, auditLogs } from '../db/schema.js';
import { DomainService } from '../services/DomainService.js';
import { ExtractionEngine } from '../ai/ExtractionEngine.js';

export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppService {
  private domainService: DomainService;
  private extractionEngine: ExtractionEngine;
  private verifyToken: string;

  constructor(verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'prop_crm_whatsapp_verify_token') {
    this.domainService = new DomainService();
    this.extractionEngine = new ExtractionEngine();
    this.verifyToken = verifyToken;
  }

  public verifyWebhook(mode?: string, token?: string, challenge?: string): { success: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return { success: true, challenge };
    }
    return { success: false };
  }

  public async processInboundMessage(params: {
    senderPhone: string;
    senderName?: string;
    messageText: string;
    externalMessageId?: string;
    rawPayload?: any;
  }) {
    const externalId = params.externalMessageId || `wa_msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = params.rawPayload ? JSON.stringify(params.rawPayload) : JSON.stringify({
      from: params.senderPhone,
      text: params.messageText,
      id: externalId,
    });

    // Synchronous execution using db or transaction
    // 1. Store Raw Message in source_records (Crucial Rule: Raw message is untouched)
    const [sourceRec] = db.insert(sourceRecords).values({
      sourceType: 'WHATSAPP',
      externalId: externalId,
      senderIdentifier: params.senderPhone,
      payload: payload,
    }).returning().all();

    // 2. Contact Resolver: Upsert Contact & Customer
    const contact = this.domainService.upsertContact({
      phoneRaw: params.senderPhone,
      firstName: params.senderName || 'WhatsApp Contact',
    });

    const customer = this.domainService.ensureCustomerForContact(contact.id, 'TENANT');

    // 3. Interaction & Message detail storage
    const [interaction] = db.insert(interactions).values({
      contactId: contact.id,
      customerId: customer.id,
      sourceRecordId: sourceRec.id,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      summary: `WhatsApp message: "${params.messageText}"`,
    }).returning().all();

    db.insert(messages).values({
      interactionId: interaction.id,
      externalId: externalId,
      senderPhone: contact.phoneNormalized,
      recipientPhone: '+919999999999', // Business number
      messageType: 'TEXT',
      body: params.messageText,
      status: 'DELIVERED',
    }).run();

    // 4. AI Extraction
    const extractionResult = await this.extractionEngine.extract(params.messageText);
    const confidence = extractionResult.overallConfidence ?? extractionResult.confidenceScore ?? 0.95;

    // 5. Create structured requirement referencing source_record_id
    let requirement: any = null;
    if (extractionResult.requirement) {
      const reqData = extractionResult.requirement as any;
      [requirement] = db.insert(requirements).values({
        customerId: customer.id,
        intent: reqData.intent || 'RENT',
        propertyType: reqData.propertyType || 'APARTMENT',
        minBedrooms: reqData.minBedrooms ?? reqData.bhk ?? reqData.bedrooms ?? null,
        minBathrooms: reqData.minBathrooms ?? null,
        preferredCities: JSON.stringify(reqData.preferredCities || ['Bangalore']),
        preferredLocations: JSON.stringify(reqData.preferredLocations || (reqData.location ? [reqData.location] : [])),
        minBudget: reqData.minBudget ?? null,
        maxBudget: reqData.maxBudget ?? reqData.budget ?? null,
        furnishingStatus: reqData.furnishingStatus || 'SEMI_FURNISHED',
        moveInDate: reqData.moveInDate || null,
        specialRequirements: reqData.notes || null,
        sourceRecordId: sourceRec.id,
        extractionConfidence: confidence,
        isVerifiedManually: false,
      }).returning().all();

      // 6. Record Extraction Run
      db.insert(extractionRuns).values({
        sourceRecordId: sourceRec.id,
        providerName: 'OpenAI',
        modelName: 'gpt-4o-mini',
        overallConfidence: confidence,
        rawExtractionResult: JSON.stringify(extractionResult),
        status: confidence >= 0.8 ? 'AUTO_COMMITTED' : 'PENDING_HUMAN_REVIEW',
      }).run();

      // 7. Record Audit Log
      db.insert(auditLogs).values({
        tableName: 'requirements',
        recordId: requirement.id,
        action: 'INSERT',
        performedBy: 'SYSTEM_AI',
        newValues: JSON.stringify(requirement),
      }).run();
    }

    return {
      sourceRecord: sourceRec,
      contact,
      customer,
      interaction,
      requirement,
      extractionResult,
    };
  }

  public async processMetaWebhook(payload: MetaWebhookPayload) {
    const results = [];
    if (payload.object === 'whatsapp_business_account' && payload.entry) {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value?.messages) {
            const contactsList = change.value.contacts || [];
            for (const msg of change.value.messages) {
              if (msg.type === 'text' && msg.text?.body) {
                const contactInfo = contactsList.find(c => c.wa_id === msg.from);
                const senderName = contactInfo?.profile?.name || 'WhatsApp User';
                const result = await this.processInboundMessage({
                  senderPhone: msg.from,
                  senderName: senderName,
                  messageText: msg.text.body,
                  externalMessageId: msg.id,
                  rawPayload: payload,
                });
                results.push(result);
              }
            }
          }
        }
      }
    }
    return results;
  }
}
