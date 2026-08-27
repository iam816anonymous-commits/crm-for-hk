# System Architecture & Database Design Research

## Executive Summary
This document outlines the architectural blueprint and relational database schema for the Rental Property CRM / Communication Intelligence System. It details the AI Extraction Pipeline (message/transcript to structured CRM data, confidence scoring, runtime validation, and Human-in-the-Loop review), the relational database schema, and an end-to-end system topology.

---

## 1. AI Extraction Architecture

The AI extraction pipeline converts unstructured communication inputs (WhatsApp messages, call audio transcripts, voice notes, manual notes) into validated structured CRM entities (Customer Profile, Requirement, Lead, Visit, Interaction).

```
+-----------------------------------------------------------------------------------+
|                              AI EXTRACTION PIPELINE                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Inbound Message / Voice Note / Call Transcript ]                              |
|                          |                                                        |
|                          v                                                        |
|             +--------------------------+                                          |
|             | Audio Transcription      | (OpenAI Whisper / Deepgram - if audio)    |
|             +--------------------------+                                          |
|                          |                                                        |
|                          v                                                        |
|             +--------------------------+                                          |
|             | LLM Entity Extractor     | (Structured Outputs / JSON Mode)         |
|             +--------------------------+                                          |
|                          |                                                        |
|                          v                                                        |
|             +--------------------------+                                          |
|             | Schema & Range Validator | (Pydantic / Zod Runtime Verification)      |
|             +--------------------------+                                          |
|                          |                                                        |
|          +---------------+---------------+                                        |
|          |                               |                                        |
|          v                               v                                        |
|  [ Confidence >= 0.85 ]          [ Confidence < 0.85 ]                          |
|          |                               |                                        |
|          v                               v                                        |
|  +---------------------+       +-----------------------+                          |
|  | Auto-Commit to CRM  |       | Human-in-the-Loop     |                          |
|  | (Leads/Requirements)|       | Confirmation Queue    |                          |
|  +---------------------+       +-----------------------+                          |
|                                          |                                        |
|                                          v                                        |
|                                [ Agent Review & Edit ]                            |
|                                          |                                        |
|                                          v                                        |
|                                [ Approved & Committed ]                           |
+-----------------------------------------------------------------------------------+
```

### 1.1 Ingestion & Transcription Pipeline
1. **Unstructured Ingestion**: Inbound WhatsApp text, voice notes (`.opus`), call transcripts (from Cloud Telephony / Whisper), or agent manual notes enter the pipeline.
2. **Speech-to-Text (STT)**: If the source is an audio binary, it is passed to OpenAI Whisper / Deepgram to generate a timestamped text transcript with language detection.

### 1.2 Entity & Intent Extraction
The text string is processed by an LLM (e.g., GPT-4o / Claude 3.5 Sonnet) configured with strict JSON Schema output specifications.

**Extracted Domain Entities**:
* **Intent**: `BUY`, `RENT`, `SELL`, `LEASE`, `SCHEDULE_VISIT`, `INQUIRY`, `COMPLAINT`.
* **Property Requirements**: Property type (Apartment, Villa, Studio, Commercial), preferred locations/neighborhoods, min/max budget, bedroom count (`bhk`), bathroom count, furnishing status (`Furnished`, `Semi-Furnished`, `Unfurnished`), move-in date window, key amenities (Parking, Gym, Pool, Pet-friendly).
* **Customer Metadata**: Name, alternative contact number, email, language preference.
* **Visit Details**: Requested property ID, proposed visit date/time.

### 1.3 Confidence Scoring Model
Every extracted entity attribute is assigned a normalized confidence score between `0.00` and `1.00`.

* **Overall Extraction Confidence Score**: Calculated as the weighted average of individual field confidence scores:
  $$\text{Confidence}_{\text{total}} = \sum (w_i \cdot c_i)$$
  Where key fields like `intent` ($w=0.3$) and `budget_max` ($w=0.2$) carry higher weight.
* **Confidence Threshold Logic**:
  * `High Confidence ( >= 0.85 )`: Automatically creates or updates `requirements`, `leads`, and `interactions` in the database.
  * `Low Confidence ( < 0.85 )`: Inserts extracted payload into the `human_confirmation_queue` for manual agent verification.

### 1.4 Schema Validation Engine
Extracted JSON payloads are validated using strict runtime schema validators (e.g., Pydantic or Zod):
* Budget validation: `budget_min <= budget_max`.
* Phone number validation: Regex matching E.164 format (`^\+[1-9]\d{1,14}$`).
* Date validation: `proposed_visit_date >= current_timestamp`.
* Enumeration validation: Enum values matched against database constraint lists (`APARTMENT`, `VILLA`, `COMMERCIAL`, etc.).

### 1.5 Human-in-the-Loop (HITL) Confirmation Queue
* When an extraction fails validation or falls below the confidence threshold ($< 0.85$), a pending record is created in `human_confirmation_queue`.
* CRM agents receive a notification on their dashboard presenting side-by-side comparison:
  1. **Raw Source Content** (Original WhatsApp message or Call transcript snippet).
  2. **AI Extracted Fields** (Highlighted confidence scores per field).
* Agents can approve, edit individual fields, or reject the extraction. Upon agent approval, the data is committed to primary CRM tables (`customers`, `requirements`, `leads`, `visits`).

---

## 2. Comprehensive Database Architecture (Relational Schema)

The database design uses a PostgreSQL relational model enforcing primary keys, foreign key constraints, indexes, standard timestamps (`created_at`, `updated_at`), soft deletes (`deleted_at`), and JSONB audit trails.

```
+---------------------------------------------------------------------------------------------------+
|                                      RELATIONAL ER DIAGRAM                                        |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ customers ] <-----+--- [ requirements ]                                                         |
|         ^            |          ^                                                                 |
|         |            |          |                                                                 |
|  [ owners ]     [ leads ] ------+--- [ properties ] <--- [ visits ]                               |
|                     |                       ^                |                                    |
|                     v                       |                v                                    |
|             [ interactions ] --------------+------- [ transactions ]                             |
|              /        \                                                                           |
|             v          v                                                                          |
|       [ calls ]     [ messages ]                                                                  |
|          |                |                                                                       |
|          +-------+--------+                                                                       |
|                  |                                                                                |
|                  v                                                                                |
|        [ raw_source_records ]                                                                     |
|                  |                                                                                |
|                  v                                                                                |
|        [ audit_logs & human_confirmation_queue ]                                                  |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Core Relational Tables Schema

#### Table 1: `customers`
Stores prospective buyers, tenants, or client contacts.
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL UNIQUE, -- E.164 format
    whatsapp_id VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    customer_type VARCHAR(20) NOT NULL DEFAULT 'TENANT', -- TENANT, BUYER, BOTH
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BLACKLISTED
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_customers_phone ON customers(phone_number);
```

#### Table 2: `owners`
Stores property owners / landlords.
```sql
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE, -- E.164 format
    email VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_owners_phone ON owners(phone_number);
```

#### Table 3: `properties`
Stores real estate property listings managed by the business.
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(30) NOT NULL, -- APARTMENT, VILLA, STUDIO, COMMERCIAL, LAND
    listing_type VARCHAR(20) NOT NULL, -- RENT, SALE, BOTH
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    bedrooms INT DEFAULT 0,
    bathrooms NUMERIC(3,1) DEFAULT 0,
    square_feet NUMERIC(10,2),
    furnishing_status VARCHAR(30) DEFAULT 'UNFURNISHED', -- FURNISHED, SEMI_FURNISHED, UNFURNISHED
    monthly_rent NUMERIC(12,2),
    sale_price NUMERIC(12,2),
    deposit_amount NUMERIC(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type_city ON properties(property_type, city);
```

#### Table 4: `requirements`
Stores structured rental/purchase requirements collected from customers.
```sql
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    intent VARCHAR(20) NOT NULL, -- RENT, BUY
    property_type VARCHAR(30), -- APARTMENT, VILLA, STUDIO, COMMERCIAL
    min_bedrooms INT,
    min_bathrooms NUMERIC(3,1),
    preferred_cities JSONB DEFAULT '[]',
    preferred_locations JSONB DEFAULT '[]',
    min_budget NUMERIC(12,2),
    max_budget NUMERIC(12,2),
    furnishing_status VARCHAR(30),
    move_in_date DATE,
    additional_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score NUMERIC(3,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_requirements_customer ON requirements(customer_id);
```

#### Table 5: `leads`
Tracks business opportunities matching customers with requirements/properties.
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
    matched_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    assigned_agent_id UUID, -- References User/Agent entity
    stage VARCHAR(30) NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, QUALIFIED, VISIT_SCHEDULED, NEGOTIATION, WON, LOST
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    score INT DEFAULT 0,
    lost_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_leads_customer ON leads(customer_id);
CREATE INDEX idx_leads_stage ON leads(stage);
```

#### Table 6: `raw_source_records`
Immutable landing store for all raw payload data from WhatsApp webhooks, call logs, audio recordings, or manual forms.
```sql
CREATE TABLE raw_source_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(30) NOT NULL, -- WHATSAPP, PHONE_CALL, AUDIO_RECORDING, MANUAL_ENTRY
    external_id VARCHAR(255), -- Meta wamid, Telephony Call SID, etc.
    sender_identifier VARCHAR(100), -- Phone number or WhatsApp ID
    recipient_identifier VARCHAR(100),
    payload JSONB NOT NULL, -- Full unparsed payload
    media_url TEXT,
    checksum VARCHAR(64), -- SHA-256 string for verification
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_raw_source_checksum ON raw_source_records(checksum);
CREATE INDEX idx_raw_source_external ON raw_source_records(external_id);
```

#### Table 7: `interactions`
Unified communication ledger combining WhatsApp, phone calls, and manual notes.
```sql
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    raw_source_id UUID REFERENCES raw_source_records(id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL, -- WHATSAPP, CALL, IN_PERSON, EMAIL, MANUAL_NOTE
    direction VARCHAR(10) NOT NULL, -- INBOUND, OUTBOUND
    summary TEXT,
    sentiment VARCHAR(20), -- POSITIVE, NEUTRAL, NEGATIVE
    ai_confidence NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
```

#### Table 8: `calls`
Detailed telephone call metadata and transcript linkage.
```sql
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    call_sid VARCHAR(100) UNIQUE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    call_status VARCHAR(20) NOT NULL, -- COMPLETED, BUSY, NO_ANSWER, FAILED, CANCELED
    recording_url TEXT,
    transcript TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_calls_interaction ON calls(interaction_id);
```

#### Table 9: `messages`
Individual WhatsApp or SMS text message records.
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(100) UNIQUE,
    sender_phone VARCHAR(20) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT', -- TEXT, IMAGE, AUDIO, DOCUMENT, LOCATION, TEMPLATE
    body TEXT,
    media_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DELIVERED', -- SENT, DELIVERED, READ, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_interaction ON messages(interaction_id);
```

#### Table 10: `visits`
Property viewing appointments scheduled with prospective tenants/buyers.
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
    feedback TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_visits_property ON visits(property_id);
CREATE INDEX idx_visits_customer ON visits(customer_id);
```

#### Table 11: `transactions`
Financial agreements, lease sign-ups, deposits, or sales transactions.
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL, -- RENTAL_LEASE, PROPERTY_SALE
    amount NUMERIC(12,2) NOT NULL,
    deposit_paid NUMERIC(12,2) DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- DRAFT, PENDING, ACTIVE, COMPLETED, CANCELLED
    contract_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
```

#### Table 12: `follow_ups`
Automated or agent-assigned follow-up tasks and reminders.
```sql
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_agent_id UUID,
    due_date TIMESTAMPTZ NOT NULL,
    reminder_type VARCHAR(30) NOT NULL, -- SEND_WHATSAPP, CALL_CUSTOMER, SCHEDULE_VISIT, CONTRACT_RENEWAL
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, OVERDUE, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_follow_ups_due ON follow_ups(due_date, status);
```

#### Table 13: `human_confirmation_queue`
Pending low-confidence AI extractions requiring human agent verification.
```sql
CREATE TABLE human_confirmation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_source_id UUID NOT NULL REFERENCES raw_source_records(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    extracted_entity_type VARCHAR(50) NOT NULL, -- REQUIREMENT, VISIT, LEAD
    extracted_payload JSONB NOT NULL,
    confidence_score NUMERIC(3,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, MODIFIED, REJECTED
    reviewed_by UUID, -- Agent ID
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_human_queue_status ON human_confirmation_queue(status);
```

#### Table 14: `audit_logs`
Immutable compliance audit trail capturing state changes across all core entities.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    performed_by VARCHAR(100) NOT NULL, -- User ID, Agent ID, or SYSTEM_AI
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_record ON audit_logs(table_name, record_id);
```

---

## 3. Recommended End-to-End System Architecture

```
+----------------------------------------------------------------------------------------+
|                                RECOMMENDED SYSTEM ARCHITECTURE                         |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|  [ WhatsApp Webhooks ]    [ Cloud Telephony Webhooks ]    [ Mobile App / Voice Notes ] |
|            |                           |                               |               |
|            +---------------------------+-------------------------------+               |
|                                        |                                               |
|                                        v                                               |
|                        +-------------------------------+                               |
|                        | API Gateway / Webhook Handler | (FastAPI / Node.js)           |
|                        +-------------------------------+                               |
|                                        |                                               |
|                         (Enqueue Raw Event Payload)                                    |
|                                        v                                               |
|                        +-------------------------------+                               |
|                        | Message Queue (Redis/BullMQ)  |                               |
|                        +-------------------------------+                               |
|                                        |                                               |
|                                        v                                               |
|                        +-------------------------------+                               |
|                        | AI Processing Worker Pool     |                               |
|                        |  - Whisper STT                |                               |
|                        |  - LLM Entity Extractor       |                               |
|                        |  - Pydantic Validation        |                               |
|                        +-------------------------------+                               |
|                                        |                                               |
|                   +--------------------+--------------------+                          |
|                   |                                         |                          |
|                   v (High Confidence)                       v (Low Confidence)         |
|        +---------------------+                   +-----------------------+             |
|        | Primary PostgreSQL  |                   | HITL Confirmation     |             |
|        | Database            |                   | Queue                 |             |
|        +---------------------+                   +-----------------------+             |
|                   ^                                         |                          |
|                   |                                         v                          |
|                   +--------------------------------- [ CRM Dashboard ]                 |
|                                                     (React / Next.js)                  |
+----------------------------------------------------------------------------------------+
```

### Architecture Components:
1. **API & Webhook Ingestion Layer**: Lightweight, high-throughput REST API gateway (FastAPI or Node.js/TypeScript). Performs HMAC signature verification, acknowledges webhooks within 200ms, and stores raw payloads into `raw_source_records`.
2. **Asynchronous Task Queue**: Redis with BullMQ or Celery to decouple ingestion from heavy AI inference tasks.
3. **AI Worker Pool**: Background workers executing audio transcription via OpenAI Whisper API and entity extraction via LLM. Evaluates confidence scores and applies schema validation.
4. **PostgreSQL Relational Storage**: Stores normalized core domain entities, raw source logs, and audit trails.
5. **Agent CRM Dashboard**: Frontend web application (React/Next.js) enabling real-time lead management, interaction history timeline view, property matching, and HITL review queue.
