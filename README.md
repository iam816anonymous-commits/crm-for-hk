# Rental Property CRM & Communication Intelligence System

[![Node.js CI](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20Drizzle%20ORM-orange)](https://orm.drizzle.team)
[![Tests Passing](https://img.shields.io/badge/Vitest-38%2F38%20Passing-emerald)](https://vitest.dev)

> **Vision**: A unified, authenticated multi-tenant communication intelligence CRM built specifically for rental property businesses. Captures leads from WhatsApp, phone call metadata, permitted call recordings, and manual entries—automatically normalizing identities, extracting structured rental requirements, and generating deterministic property matches without corrupting human-verified data.

---

## 🚀 Key Implemented Features (Phases 0 – 10)

### 1. Authentication, RBAC & Multi-Tenant Isolation (Phase 10)
* **Organization Signup & Onboarding**: Organization registration (`POST /api/auth/register-org`) creating `ADMIN` users and workspace boundaries. Team invitation & acceptance (`POST /api/auth/invitation` and `POST /api/auth/accept-invitation`).
* **Session & Password Security**: Node.js native `crypto.scrypt` password hashing with random salt and JWT session token verification (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`).
* **Server-Side RBAC Enforcement**: Role-based permissions supporting `ADMIN`, `BROKER`, `STAFF`, and `VIEWER` roles.
* **Multi-Tenant Isolation & IDOR Protection**: Every CRM table contains an indexed `organizationId` foreign key. All queries enforce `WHERE organization_id = authenticatedUser.organizationId` at the database boundary to reject unauthorized ID manipulation.
* **Production UI Real Data Integration**: Complete removal of mock frontend data dependencies. Clean empty states render when tables contain zero records.
* **Explicit Development Seeding**: `npm run db:seed` command for local testing setup (never run automatically on startup or migrations).

### 2. Canonical Domain Architecture & Database Foundation (Phase 1)
* **Canonical Contact Resolution**: E.164 phone normalization (`+91XXXXXXXXXX`) ensuring a single person maintains a single identity regardless of communication channel.
* **Role-Based Decoupling**: Separate `customers` (Tenants/Buyers) and `owners` role tables linked to canonical `contacts.id`.
* **20 Normalized Schema Tables**: SQLite database using Drizzle ORM covering `organizations`, `users`, `sessions`, `invitations`, `contacts`, `customers`, `owners`, `properties`, `property_media`, `requirements`, `leads`, `interactions`, `messages`, `calls`, `visits`, `transactions`, `followups`, `source_records`, `extraction_runs`, and `audit_logs`.

### 3. Full React Web Dashboard & Manual Workflows (Phases 2 & 3)
* **Responsive Dashboard**: Real-time business KPIs (Total Properties, Available Listings, Occupied Units, New/High Priority Leads, Scheduled Visits).
* **10-Stage Lead Pipeline**: Visual state-machine pipeline (`NEW` → `CONTACTED` → `QUALIFIED` → `PROPERTIES_SENT` → `VISIT_SCHEDULED` → `VISITED` → `NEGOTIATION` → `CLOSED` / `LOST` / `NOT_INTERESTED` / `ON_HOLD`).
* **Manual CRM Actions**: Full forms for adding Contacts, Owners, Properties, Requirements, Visits, and Follow-ups.

### 4. Deterministic Property Matching Engine (Phase 4)
* **100-Point Scoring Algorithm**: Evaluates tenant requirements against available listings based on explicit weighted dimensions:
  * Location / City Overlap (30%)
  * BHK Preference (20%)
  * Budget Range (20%)
  * Furnishing Status (10%)
  * Availability Date (10%)
  * Property Type (5%)
  * Special Requirements / Parking (5%)

### 5. Official Meta WhatsApp Cloud API Ingestion (Phase 5)
* Ingests inbound WhatsApp messages via `POST /api/whatsapp/webhook` with HMAC SHA-256 signature verification (`X-Hub-Signature-256`).

### 6. Generic 7-Stage AI Extraction Pipeline & Human Verification Queue (Phases 6 & 7)
* Vendor-agnostic AI pipeline (`OpenAI`, `Gemini`, `OpenRouter`) extracting rental criteria and routing extractions to human approval queue (`/api/reviews/pending`).

### 7. Native Android Call Log Companion App & Call Intelligence (Phases 8 & 9)
* Syncs phone call metadata from Android WorkManager companion app and processes permitted user call recordings via Whisper Speech-to-Text.

---

## 🛠️ How to Execute & Run the System

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

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
DATABASE_URL=data/rental_crm.db
JWT_SECRET=rental_crm_default_jwt_secret_key_change_in_production_8910
COMPANION_API_TOKEN=app_sync_88192a
WHATSAPP_VERIFY_TOKEN=prop_crm_whatsapp_verify_token
META_APP_SECRET=your_meta_app_secret
OPENAI_API_KEY=your_openai_key
```

### 2. Database Migration & Optional Seeding
Initialize the SQLite database schema with Drizzle ORM:

```bash
# Run database migrations
npm run db:migrate

# (Optional) Seed sample organization & development users
npm run db:seed
```

Default seeded credentials (if seeded):
- **Admin**: `admin@apexrealty.com` / `Password123!`
- **Broker**: `broker@apexrealty.com` / `Password123!`

### 3. Start Development Server
Start the Express API server and Vite React frontend concurrently:

```bash
# Run Express backend + Vite frontend
npm run dev
```

* **Frontend Web App**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:3000`
* **Health Check**: `GET http://localhost:3000/health`

### 4. Running Test Suites
Execute the full automated test suite with Vitest:

```bash
# Run all unit & integration test suites
npm test

# Run specific auth test suite
npx vitest run src/auth.test.ts
```

### 5. Production Build
Compile TypeScript for production:

```bash
npm run build
```

---

## 📜 License
Internal Proprietary Software — **Rental Property CRM & Communication Intelligence System**. All Rights Reserved.
