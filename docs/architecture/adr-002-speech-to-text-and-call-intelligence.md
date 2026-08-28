# ADR 002: Speech-to-Text Provider Abstraction & Call Intelligence Pipeline Architecture

## Status
**ACCEPTED**

## Context
Phase 9 introduces Call Intelligence, converting permitted user-uploaded call audio recordings and cloud business telephony webhooks into structured CRM domain data (property requirements, tenant budget, preferred locations, customer objections, and scheduled follow-ups).

Speech-to-text (STT) and LLM providers must be integrated without making the domain model tightly coupled to a single vendor (e.g. OpenAI Whisper or Deepgram). Furthermore, audio recording uploads must strictly adhere to privacy rules, requiring explicit consent verification (`userConsent = true`).

## Decision

1. **Adopt Vendor-Agnostic STT Interface (`SpeechToTextProvider`)**:
   * Define `SpeechToTextProvider` interface in `src/stt/types.ts`.
   * Implement `WhisperSTTProvider` utilizing OpenAI Whisper (`whisper-1`) with structured fallback parsing for offline/test environments.

2. **Implement 3-Tier Call Ingestion Pipeline (`CallIntelligenceService`)**:
   * **Mode A (Metadata Only)**: Ingestion via `POST /api/calls/log` (Android companion app). Zero audio capture.
   * **Mode B (Permitted User Audio Upload)**: Ingestion via `POST /api/calls/upload-recording`. Enforces `userConsent = true`, runs STT transcription, executes 7-stage AI extraction, and creates a pending entry in the Human Approval Review Queue.
   * **Mode C (Cloud Telephony Webhooks)**: Ingestion via `POST /api/calls/telephony-webhook`. Validates webhook payload, links call SIDs, generates transcripts, and logs call intelligence.

3. **Enforce Human Approval Protection**:
   * AI-extracted call intelligence outputs are flagged with `isVerifiedManually = false` and routed to `/api/reviews/pending`.
   * AI extractions MUST NEVER silently overwrite existing manually verified customer requirements or property listings.

## Consequences

* **Positive**:
  * Flexible STT vendor swapping without touching domain business logic.
  * Strict legal and privacy compliance through mandatory user consent checks.
  * Complete protection against AI halluncinations silently corrupting database records.

* **Negative**:
  * Minor latency incurred during multi-stage audio transcription and LLM inference.
