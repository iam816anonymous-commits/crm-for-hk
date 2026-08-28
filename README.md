# Rental Property CRM & Communication Intelligence System

[![Node.js CI](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![SQLite & Drizzle](https://img.shields.io/badge/Database-SQLite%20%7C%20Drizzle%20ORM-orange)](https://orm.drizzle.team)
[![Tests Passing](https://img.shields.io/badge/Vitest-34%2F34%20Passing-emerald)](https://vitest.dev)

> **Vision**: A unified communication intelligence CRM built specifically for rental property businesses. Captures leads from WhatsApp, phone call metadata, permitted call recordings, and manual entries—automatically normalizing identities, extracting structured rental requirements, and generating deterministic property matches without corrupting human-verified data.

---

## 🚀 Key Implemented Features (Phases 0 – 9)

### 1. Canonical Domain Architecture & Database Foundation (Phase 1)
* **Canonical Contact Resolution**: E.164 phone normalization (`+91XXXXXXXXXX`) ensuring a single person maintains a single identity regardless of communication channel.
* **Role-Based Decoupling**: Separate `customers` (Tenants/Buyers) and `owners` role tables linked to canonical `contacts.id`.
* **17 Normalized Schema Tables**: SQLite database using Drizzle ORM covering `contacts`, `customers`, `owners`, `properties`, `property_media`, `requirements`, `leads`, `interactions`, `messages`, `calls`, `visits`, `transactions`, `followups`, `source_records`, `extraction_runs`, `audit_logs`, and `whatsapp_usage`.
* **Audit Trail**: System-wide `audit_logs` tracking field-level mutation history (`old_values` vs `new_values`) and actor provenance (`performedBy = 'USER_ID' | 'SYSTEM_AI' | 'ANDROID_COMPANION_APP'`).

### 2. Full React Web Dashboard & Manual Workflows (Phases 2 & 3)
* **Responsive Dashboard**: Real-time business KPIs (Total Properties, Available Listings, Occupied Units, New/High Priority Leads, Scheduled Visits).
* **10-Stage Lead Pipeline**: Visual state-machine pipeline (`NEW` → `CONTACTED` → `QUALIFIED` → `PROPERTIES_SENT` → `VISIT_SCHEDULED` → `VISITED` → `NEGOTIATION` → `CLOSED` / `LOST` / `NOT_INTERESTED` / `ON_HOLD`).
* **Manual CRM Actions**: Full forms for adding Contacts, Owners, Properties (with BHK, monthly rent, deposit amount, maintenance fees, and available dates), Requirements, Visits, and Follow-ups.

### 3. Deterministic Property Matching Engine (Phase 4)
* **100-Point Scoring Algorithm**: Evaluates tenant requirements against available listings based on explicit weighted dimensions:
  * Location / City Overlap (30%)
  * BHK Preference (20%)
  * Budget Range (20%)
  * Furnishing Status (10%)
  * Availability Date (10%)
  * Property Type (5%)
  * Special Requirements / Parking (5%)
* **Explainable Output**: Calculates score percentages and breakdown criteria (e.g. `94% MATCH`) without relying on opaque LLM hallucinations.

### 4. Official Meta WhatsApp Cloud API Ingestion & Cost Tracking (Phase 5)
* **Official Webhook Integration**: Ingests inbound WhatsApp messages via `POST /api/whatsapp/webhook`.
* **Security & HMAC Signature Verification**: Validates Meta `X-Hub-Signature-256` signatures using `META_APP_SECRET`.
* **Idempotency & Raw Source Preservation**: Saves raw untouched JSON payloads in `source_records` and suppresses duplicate webhooks via `wamid` message deduplication.
* **WABA Cost Observation Model (`whatsapp_usage`)**: Tracks 24-hour conversation categories (Service, Utility, Marketing, Authentication) and calculates estimated messaging costs in INR.

### 5. Generic 7-Stage AI Extraction Pipeline (Phase 6)
* **7-Stage Engine**: `RAW INPUT` → `CLASSIFICATION` → `ENTITY EXTRACTION` → `NORMALIZATION` → `VALIDATION` → `CONFIDENCE` → `ACTION`.
* **Vendor-Agnostic Abstraction**: `AIProvider` interface with modular implementations for OpenAI (`gpt-4o`), Google Gemini, and OpenRouter.
* **Field-Level Metadata**: Attaches `value`, `confidence`, `source`, `extractionRunId`, and `verified` flags to every extracted field.

### 6. Human Approval & Review Queue (Phase 7)
* **AI Protection Firewall**: Low-confidence extractions (< 0.85) or requirement updates are flagged with `isVerifiedManually = false` and routed to `/api/reviews/pending`.
* **Verification UI**: Interactive review cards allowing agents to `[Approve]`, `[Edit]`, or `[Reject]` extractions, setting `isVerifiedManually = true` upon human confirmation. Prevents AI from silently overwriting verified data.

### 7. Native Android Call Log Companion App (Phase 8)
* **Privacy-Preserving Native App**: Android WorkManager app (`com.propcrm.callsync`) requesting strictly `READ_CALL_LOG` permission (zero audio recording permissions declared).
* **Metadata Ingestion**: Computes deterministic SHA-256 `externalCallSid` hashes, normalizes phone numbers, and posts call metadata to `POST /api/calls/log` using Bearer Token authentication.
* **Gradle Debug Build Verified**: Fully compiled debug APK (`gradle assembleDebug` - BUILD SUCCESSFUL).

### 8. Call Intelligence & Speech-to-Text Pipeline (Phase 9)
* **3 Ingestion Modes**:
  * **Mode A**: Call Metadata Sync (Android companion app log).
  * **Mode B**: Permitted User Audio Recording Upload (`POST /api/calls/upload-recording`) enforcing explicit user consent (`userConsent = true`).
  * **Mode C**: Cloud Business Telephony Webhooks (`POST /api/calls/telephony-webhook`) for Twilio / Exotel.
* **STT Provider Abstraction**: Vendor-agnostic `SpeechToTextProvider` interface with `WhisperSTTProvider` implementation.
* **Transcript Extraction**: Converts speech transcripts into structured CRM requirements, customer objections, and pending review queue entries.

---

## 🔮 Roadmap & Upcoming Improvements (Phases 10 – 14)

```text
PHASE 10 (Next) ──► Customer 360 / Conversation Intelligence
PHASE 11       ──► Natural-Language Search & Safe Query Builder
PHASE 12       ──► Automated Follow-up Engine & Task SLA Escalation
PHASE 13       ──► Analytics, Reporting & Broker Metrics
PHASE 14       ──► Security Hardening & Production Operations
```

### Planned Additions
1. **Phase 10 — Customer 360 View**: Aggregate profile, roles, requirements, property matches, WhatsApp history, call transcripts, scheduled visits, and AI conversation summaries into a unified 360-degree timeline.
2. **Phase 11 — Natural-Language Search**: Query CRM using plain English (e.g. *"Active customers looking for 2BHK under ₹25,000 in Whitefield"*). Translates natural language into structured Zod schema filters without executing arbitrary AI-generated SQL.
3. **Phase 12 — Automated Follow-up Engine**: Automatically detect follow-up commitments (e.g., *"Call me tomorrow"*, *"Let's visit Sunday"*) from WhatsApp and call transcripts, generating task queues with SLA escalation timers.
4. **Phase 13 — Analytics & Reporting**: Business KPIs (brokerage, conversion rates, average time to close, days on market) and broker performance metrics.
5. **Phase 14 — Production Hardening**: Rate limiting, RBAC role enforcement, environment secret rotation, and automated database backup/restore procedures.

---

## 🛠️ How to Execute & Run the System

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Java SDK & Gradle** (Optional, for Android Companion App build): JDK 17+ and Gradle 8.8

### 1. Installation & Environment Setup
Clone the repository and install dependencies:

```bash
# Install Node.js dependencies
npm install

# Copy environment template
cp .env.example .env
```

Key environment variables in `.env`:
```env
PORT=3000
DATABASE_URL=data/app.db
COMPANION_API_TOKEN=app_sync_88192a
WHATSAPP_VERIFY_TOKEN=prop_crm_whatsapp_verify_token
META_APP_SECRET=your_meta_app_secret
OPENAI_API_KEY=your_openai_key
```

### 2. Database Migration & Initialization
Initialize the SQLite database schema with Drizzle ORM:

```bash
# Run database migrations
npm run db:migrate
```

### 3. Start Development Server
Start the Express API server and Vite React frontend concurrently:

```bash
# Run Express backend + Vite frontend
npm run dev
```

* **Frontend App**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:3000`
* **Health Check**: `GET http://localhost:3000/health`

### 4. Running Test Suites
Execute the full automated test suite with Vitest:

```bash
# Run all unit & integration test suites
npm test

# Run specific test file
npx vitest run src/calls-intelligence.test.ts
```

### 5. Compiling Android Companion Application
Compile the native Android companion APK:

```bash
cd android
gradle assembleDebug
```
Output APK generated at: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📁 Repository Structure

```text
.
├── android/                   # Native Android Call Log Sync Companion App (Kotlin)
│   ├── app/src/main/java/     # PermissionActivity, CallLogReader, CallSyncWorker
│   └── build.gradle           # Android Gradle build configuration
├── docs/                      # Technical Documentation
│   ├── architecture/          # ADRs, Gap Analysis, Call Sync & Cost Architecture
│   ├── database/              # Schema specifications
│   ├── research/              # WhatsApp Platform Audit, Android Capabilities, CRM Audits
│   └── testing/               # Phase verification reports
├── drizzle/                   # SQL migration scripts & snapshots
├── src/                       # Backend & Frontend Source Code
│   ├── ai/                    # 7-Stage AIPipeline, OpenAI/Gemini Providers
│   ├── db/                    # Drizzle schema definition & connection setup
│   ├── frontend/              # React Web UI (Dashboard, Contacts, Communication, Matches)
│   ├── matching/              # Deterministic Property Matching Engine
│   ├── repositories/          # Domain data repositories
│   ├── schemas/               # Zod API validation schemas
│   ├── services/              # DomainService, DashboardService, CallIntelligenceService
│   ├── stt/                   # SpeechToTextProvider interface & WhisperSTTProvider
│   ├── whatsapp/              # Official Meta WABA Cloud API routes & webhook logic
│   └── app.ts                 # Express application entrypoint
├── README.md                  # Project overview & execution guide
├── package.json               # Node.js dependencies & scripts
├── tsconfig.json              # TypeScript compiler configuration
└── vitest.config.ts           # Vitest test runner configuration
```

---

## 📜 License
Internal Proprietary Software — **Rental Property CRM & Communication Intelligence System**. All Rights Reserved.
