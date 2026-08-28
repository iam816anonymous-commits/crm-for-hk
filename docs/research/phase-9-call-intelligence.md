# Phase 9 Architectural Research: Call Intelligence, Speech-to-Text & Business Telephony

## Executive Summary
This document provides a technical research analysis for Phase 9 (Call Intelligence Pipeline) of the Rental Property CRM & Communication Intelligence System. It outlines the three operational modes of call ingestion (Mode A: Metadata Sync, Mode B: Permitted User-Uploaded Audio Recording, Mode C: Cloud Business Telephony Webhooks), Speech-to-Text (STT) provider abstractions, transcript extraction pipelines, consent validation, and human review integration.

---

## 1. Operational Modes of Call Intelligence

```
+-----------------------------------------------------------------------------------+
|                        PHASE 9 CALL INTELLIGENCE PIPELINE                         |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ MODE A: Metadata ]                                                             |
|  Android Companion App / PSTN Log -> Metadata Record in CRM                       |
|                                                                                   |
|  [ MODE B: Permitted Audio Upload ]                                               |
|  User Audio File + Explicit Consent -> STT Provider -> Transcript                 |
|                                         |                                         |
|  [ MODE C: Cloud Business Telephony ]   v                                         |
|  Twilio / Exotel Webhook + IVR -------> 7-Stage AI Extraction Engine              |
|                                         |                                         |
|                                         v                                         |
|                                  Structured Call Intelligence                     |
|                                  (Summary, BHK, Location, Budget, Objections)     |
|                                         |                                         |
|                                         v                                         |
|                                  Human Verification Queue                         |
+-----------------------------------------------------------------------------------+
```

### 1.1 Mode A — Call Metadata
* **Source**: Android Companion App (`com.propcrm.callsync`) or manual call log entry.
* **Fields Captured**: `externalCallSid`, `fromNumber`, `toNumber`, `durationSeconds`, `callStatus`, `timestampMs`.
* **Audio Capture**: **NONE**. Zero audio recorded or transmitted.

### 1.2 Mode B — Permitted User-Provided Audio Recording Upload
* **Source**: Voluntary user upload of audio files (e.g. recorded meeting debrief, WhatsApp voice note, or consent-based client phone call recording file).
* **Mandatory Constraint**: Must include explicit consent flag (`userConsent = true`) confirming all recorded parties consented to audio capture.
* **Flow**: Audio file -> Speech-To-Text Provider (e.g., OpenAI Whisper) -> Text Transcript -> 7-Stage AI Extraction Engine (`AIPipeline`) -> Structured Entities (BHK, Budget, Location, Objections, Next Actions) -> Pending Human Review Queue.

### 1.3 Mode C — Cloud Business Telephony Integration
* **Source**: Cloud PBX Providers (e.g., Twilio, Exotel, Plivo, Amazon Connect).
* **Compliance**: Automatic dual-channel recording with mandatory IVR announcement (*"This call is recorded for quality and training purposes"*).
* **Flow**: Telephony Webhook (`POST /api/calls/telephony-webhook`) -> Raw Payload preserved in `source_records` -> Dual-channel audio download -> STT Provider -> AI Extraction -> CRM Interaction Ledger.

---

## 2. Speech-to-Text (STT) Provider Abstraction Architecture

To avoid vendor lock-in, STT functionality is decoupled behind a unified `SpeechToTextProvider` interface:

```typescript
export interface TranscriptionResult {
  providerName: string;
  modelName: string;
  transcriptText: string;
  confidenceScore: number;
  durationSeconds?: number;
  rawResponse?: any;
}

export interface SpeechToTextProvider {
  readonly name: string;
  readonly model: string;
  transcribeAudio(audioBuffer: Buffer, filename: string, mimeType?: string): Promise<TranscriptionResult>;
}
```

### Implementations:
1. `WhisperSTTProvider`: OpenAI Whisper API (`https://api.openai.com/v1/audio/transcriptions` using `whisper-1` model) with structured heuristics fallback when API keys are unconfigured.
2. `MockSTTProvider`: Test provider returning deterministic audio transcripts.

---

## 3. Structured Call Intelligence Output Schema

Transcripts processed by the AI extraction engine yield structured call intelligence containing:

```typescript
export interface CallIntelligenceExtraction {
  summary: string;
  customerIntent: 'RENT' | 'BUY';
  minBedrooms?: number;
  maxBudget?: number;
  preferredLocations?: string[];
  moveInDate?: string;
  customerObjections?: string[];
  nextAction?: string;
  followUpDate?: string;
  confidenceScore: number;
}
```

Every extraction run with confidence < 0.85 or containing requirement mutations enters the **Human Approval Review Queue** (`/api/reviews/pending`), ensuring AI never silently overwrites human-verified CRM records.
