import { db as defaultDb } from '../db/index.js';
import { sourceRecords, calls, interactions, requirements, extractionRuns, auditLogs } from '../db/schema.js';
import { DomainService } from './DomainService.js';
import { ExtractionEngine } from '../ai/ExtractionEngine.js';
import { SpeechToTextProvider } from '../stt/types.js';
import { WhisperSTTProvider } from '../stt/WhisperSTTProvider.js';
import { eq } from 'drizzle-orm';

export class CallIntelligenceService {
  private domainService: DomainService;
  private extractionEngine: ExtractionEngine;
  private sttProvider: SpeechToTextProvider;
  private dbConn: any;

  constructor(customDb = defaultDb, sttProvider?: SpeechToTextProvider) {
    this.dbConn = customDb;
    this.domainService = new DomainService(customDb);
    this.extractionEngine = new ExtractionEngine();
    this.sttProvider = sttProvider || new WhisperSTTProvider();
  }

  // Mode B: Process User Permitted Audio Recording Upload
  async processPermittedAudioUpload(params: {
    phoneRaw: string;
    audioBuffer?: Buffer;
    filename?: string;
    mimeType?: string;
    userConsent: boolean;
  }) {
    if (!params.userConsent) {
      throw new Error('User consent (userConsent = true) is strictly required to process call audio recordings.');
    }

    const filename = params.filename || 'recording.mp3';
    const buffer = params.audioBuffer || Buffer.from('mock_audio_content');

    // 1. Perform Speech-to-Text Transcription
    const sttResult = await this.sttProvider.transcribeAudio(buffer, filename, params.mimeType);

    // 2. Perform 7-Stage AI Extraction on Transcript
    const aiResult = await this.extractionEngine.extract(sttResult.transcriptText);
    const confidence = aiResult.overallConfidence ?? aiResult.confidenceScore ?? 0.90;

    // 3. Database Execution
    return this.dbConn.transaction((tx: any) => {
      // Create Raw Source Record
      const [sourceRec] = tx.insert(sourceRecords).values({
        sourceType: 'RECORDING',
        senderIdentifier: params.phoneRaw,
        payload: JSON.stringify({
          filename,
          mimeType: params.mimeType || 'audio/mpeg',
          sttResult,
        }),
      }).returning().all();

      // Ensure Contact & Customer Role
      const contact = this.domainService.upsertContact({
        phoneRaw: params.phoneRaw,
        firstName: 'Call Client',
      }, tx);

      const customer = this.domainService.ensureCustomerForContact(contact.id, 'TENANT', tx);

      // Create Interaction Record
      const [interaction] = tx.insert(interactions).values({
        contactId: contact.id,
        customerId: customer.id,
        sourceRecordId: sourceRec.id,
        channel: 'CALL',
        direction: 'INBOUND',
        summary: `Call Recording Transcript Summary: ${aiResult.summary}`,
      }).returning().all();

      // Create Detailed Call Record with Transcript
      const [callRec] = tx.insert(calls).values({
        interactionId: interaction.id,
        externalCallSid: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromNumber: contact.phoneNormalized,
        toNumber: '+919999999999',
        durationSeconds: sttResult.durationSeconds || 120,
        callStatus: 'COMPLETED',
        transcript: sttResult.transcriptText,
      }).returning().all();

      // Create Requirement referencing Source Record & Flagging for Human Review Queue
      let requirement: any = null;
      if (aiResult.requirement) {
        const reqData = aiResult.requirement as any;
        [requirement] = tx.insert(requirements).values({
          customerId: customer.id,
          intent: reqData.intent || 'RENT',
          propertyType: reqData.propertyType || 'APARTMENT',
          minBedrooms: reqData.minBedrooms ?? reqData.bhk ?? 2,
          preferredCities: JSON.stringify(reqData.preferredCities || ['Bangalore']),
          preferredLocations: JSON.stringify(reqData.preferredLocations || (reqData.location ? [reqData.location] : ['Whitefield'])),
          minBudget: reqData.minBudget ?? null,
          maxBudget: reqData.maxBudget ?? reqData.budget ?? 25000,
          moveInDate: reqData.moveInDate || null,
          specialRequirements: reqData.notes || null,
          sourceRecordId: sourceRec.id,
          extractionConfidence: confidence,
          isVerifiedManually: false, // Enforce Human Approval Queue rule
        }).returning().all();

        // Record Extraction Run
        tx.insert(extractionRuns).values({
          sourceRecordId: sourceRec.id,
          providerName: sttResult.providerName,
          modelName: sttResult.modelName,
          overallConfidence: confidence,
          rawExtractionResult: JSON.stringify(aiResult),
          status: 'PENDING_HUMAN_REVIEW',
        }).run();

        // Audit Trail
        tx.insert(auditLogs).values({
          tableName: 'calls',
          recordId: callRec.id,
          action: 'INSERT',
          performedBy: 'CALL_INTELLIGENCE_SERVICE',
          newValues: JSON.stringify({
            transcript: sttResult.transcriptText,
            extractionConfidence: confidence,
          }),
        }).run();
      }

      return {
        sourceRecord: sourceRec,
        contact,
        customer,
        interaction,
        call: callRec,
        transcript: sttResult.transcriptText,
        requirement,
        extractionResult: aiResult,
      };
    });
  }

  // Mode C: Process Telephony Provider Webhooks (Twilio/Exotel)
  async processTelephonyWebhook(params: {
    callSid: string;
    fromNumber: string;
    toNumber: string;
    durationSeconds: number;
    recordingUrl?: string;
    transcriptText?: string;
    callStatus: string;
  }) {
    // Check duplicate call Sid
    const existingCall = this.dbConn.select().from(calls).where(eq(calls.externalCallSid, params.callSid)).get();
    if (existingCall) {
      return { status: 'DUPLICATE', call: existingCall };
    }

    let transcript = params.transcriptText;
    if (!transcript && params.recordingUrl) {
      const stt = await this.sttProvider.transcribeAudio(Buffer.from('telephony_audio'), 'telephony.mp3');
      transcript = stt.transcriptText;
    }

    const aiResult = transcript ? await this.extractionEngine.extract(transcript) : null;

    return this.dbConn.transaction((tx: any) => {
      const contact = this.domainService.upsertContact({
        phoneRaw: params.fromNumber,
        firstName: 'Telephony Client',
      }, tx);

      const customer = this.domainService.ensureCustomerForContact(contact.id, 'TENANT', tx);

      const [sourceRec] = tx.insert(sourceRecords).values({
        sourceType: 'RECORDING',
        externalId: params.callSid,
        senderIdentifier: params.fromNumber,
        payload: JSON.stringify(params),
      }).returning().all();

      const [interaction] = tx.insert(interactions).values({
        contactId: contact.id,
        customerId: customer.id,
        sourceRecordId: sourceRec.id,
        channel: 'CALL',
        direction: 'INBOUND',
        summary: `Cloud Telephony Call - ${params.durationSeconds}s (${params.callStatus})`,
      }).returning().all();

      const [callRec] = tx.insert(calls).values({
        interactionId: interaction.id,
        externalCallSid: params.callSid,
        fromNumber: params.fromNumber,
        toNumber: params.toNumber,
        durationSeconds: params.durationSeconds,
        callStatus: params.callStatus,
        recordingUrl: params.recordingUrl,
        transcript: transcript || null,
      }).returning().all();

      tx.insert(auditLogs).values({
        tableName: 'calls',
        recordId: callRec.id,
        action: 'INSERT',
        performedBy: 'CLOUD_TELEPHONY_WEBHOOK',
        newValues: JSON.stringify(params),
      }).run();

      return {
        status: 'CREATED',
        call: callRec,
        contact,
        customer,
        interaction,
        aiResult,
      };
    });
  }
}
