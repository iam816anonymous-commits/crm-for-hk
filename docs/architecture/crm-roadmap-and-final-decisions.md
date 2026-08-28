# CRM Product Improvement Roadmap & Final Architecture Decisions

## Executive Summary
This document consolidates product improvement recommendations derived from our CRM Reference Architecture Audit (Part F) and defines the **Final Architecture Decision** (Part H) governing system readiness for Phase 9 implementation.

---

## 1. CRM Product Improvements Roadmap (Part F)

Product features and architectural enhancements are prioritized as **P0 (Required for Phase 9)**, **P1 (Important for post-Phase 9 robustness)**, and **P2 (Useful later / Backlog)**.

### Priority 0 (P0 — Required)
* **P0.1: Configurable WhatsApp Usage & Cost Observation Engine**: Implement `whatsapp_usage` database model and API tracking to record WABA conversation categories (Marketing, Utility, Service) and estimated cost in INR without hardcoding rates.
* **P0.2: Webhook HMAC Signature Verification**: Enforce `X-Hub-Signature-256` HMAC validation on `POST /api/whatsapp/webhook` to prevent unauthenticated payload injection.
* **P0.3: Visual Lead Pipeline Stage Timers**: Display "Days in Stage" indicators on `LeadsView.tsx` Kanban cards to highlight stagnated tenant leads.

### Priority 1 (P1 — Important)
* **P1.1: Automated SLA Escalation for Follow-ups**: Display overdue follow-up warning banners on the main Dashboard and trigger agent reminders when a visit follow-up exceeds 24 hours.
* **P1.2: Role-Based Access Control (RBAC) Enforcement**: Restrict property deletion and manual requirement overrides to `ADMIN` and `MANAGER` roles via API middleware.
* **P1.3: Audit Log Visual Timeline**: Add a dedicated "Audit History" tab in `ContactDetailView.tsx` showing chronological field modifications (`old_values` vs `new_values`).

### Priority 2 (P2 — Useful Later / Do Not Implement Yet)
* **P2.1: Bulk CSV/Excel Contact Import/Export Engine**: Batch importing external CSV contact lists with E.164 phone validation.
* **P2.2: Multi-Property Side-by-Side Comparison Matrix**: Visual modal allowing tenants to compare 3 properties side-by-side on rent, deposit, furnishing, and distance to tech parks.
* **P2.3: Automated Email Notification Gateway**: Sending automated email receipts alongside WhatsApp messages.

---

## 2. Final Architectural Decisions (Part H)

### 2.1 What We Should Adopt
1. **Decoupled Canonical Identity Pattern**: Preserve single `contacts` table (E.164 normalized) with separate role records (`customers`, `owners`).
2. **Polymorphic Interaction Chatter Stream**: Continue recording all communication (WhatsApp, call logs, visits, manual notes) in `interactions` and `source_records`.
3. **Configurable WABA Cost Observation Model**: Adopt `whatsapp_usage` schema for tracking Meta messaging costs.
4. **Strict Webhook Idempotency & HMAC Security**: Enforce `wamid` deduplication and `X-Hub-Signature-256` validation.

### 2.2 What We Should NOT Adopt
1. **Third-Party WhatsApp Web Scraping / Reverse-Engineered Libraries**: DO NOT use Baileys, whatsapp-web.js, or browser automation.
2. **Direct Client-Side Call Audio Recording**: DO NOT attempt PSTN call recording on Android 9+ via non-standard APIs.
3. **Generic Heavy CRM Frameworks**: DO NOT introduce monolithic ORMs or complex enterprise dependencies (e.g., Spring/Frappe/Java) that obscure our TypeScript/Drizzle/SQLite stack.

### 2.3 What Needs to Change in Existing Architecture
1. **Schema Expansion**: Add `whatsapp_usage` table to `src/db/schema.ts` for cost tracking.
2. **Webhook Middleware**: Attach Meta App Secret HMAC verification in `src/whatsapp/routes.ts`.
3. **Dynamic Counterparty Resolution**: Ensure Android call log sync endpoint (`POST /api/calls/log`) relies on explicit `direction` fields rather than hardcoded test phone numbers.

### 2.4 What Can Remain Unchanged
1. Core 18 SQLite schema tables in `src/db/schema.ts`.
2. Deterministic Property Matching Engine (`MatchingEngine.ts`).
3. 7-Stage AI Extraction Pipeline (`AIPipeline.ts`).
4. Human Approval Review Queue (`/api/reviews/pending`).
5. Native Android Companion App architecture (`com.propcrm.callsync`).

---

## 3. Phase 9 Prerequisites Checklist

- [x] Reference Architecture Audit completed (`docs/research/crm-reference-audit.md`).
- [x] Rental CRM Gap Analysis verified (`docs/architecture/crm-gap-analysis.md`).
- [x] WhatsApp Business Platform Audit completed (`docs/research/whatsapp-platform-audit.md`).
- [x] WhatsApp Pricing & Cost Model designed (`docs/research/whatsapp-pricing-model.md`).
- [x] Architectural Decision Record created (`docs/architecture/adr-001-whatsapp-cost-model-and-webhook-idempotency.md`).
- [x] All 30 unit/integration tests passing cleanly (`npx vitest run`).
- [x] Native Android companion app compiling cleanly (`gradle assembleDebug`).

**PHASE 9 READINESS VERDICT: READY TO BEGIN PHASE 9**
