# Normalized Database Schema Documentation

## Executive Overview
This document serves as the official relational schema documentation for the Rental Property CRM & Communication Intelligence System (Phase 1). It outlines the normalized database model implemented using **SQLite** with **Drizzle ORM**, detailing table definitions, canonical contact resolution, role decoupling, foreign key constraints, indexes, and AI extraction provenance tracking.

---

## Key Domain Modeling Rules

1. **Canonical Person Record**: A person has a single canonical `contacts` record. Phone numbers are normalized into standard **E.164** format (`+14155552671`), with a `UNIQUE` constraint preventing duplicate person creation.
2. **Decoupled Role Model**: Customer, Owner, Tenant, Buyer, Seller, and Broker are roles (`customers`, `owners`) linked via foreign key to `contacts.id`, rather than duplicated contact rows.
3. **Property & Requirement Ownership**:
   - A `properties` record belongs to an `owners` (and underlying `contacts`) entity.
   - A `requirements` record belongs to a `customers` (and underlying `contacts`) entity.
4. **Unified Communication Ledger**: Messages (`messages`) and telephone calls (`calls`) are detail records under unified `interactions` linked to contacts and leads.
5. **AI Extraction Provenance & Protection**:
   - `source_records` stores immutable raw incoming metadata.
   - `extraction_runs` tracks AI model extractions and confidence scores (`0.00` - `1.00`).
   - `is_verified_manually` flag ensures AI extractions **never** silently overwrite manually verified fields (Rule #10).
6. **SQLite Storage Tuning**: Configured with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.

---

## Entity-Relationship Diagram (ERD)

```
+------------------+         +------------------+         +------------------+
|     contacts     | <-------|    customers     | <-------|   requirements   |
| (Canonical Person|         |  (Role Table)    |         | (Property Criteria|
+------------------+         +------------------+         +------------------+
         ^                            ^                            ^
         |                            |                            |
         |                   +------------------+                  |
         +-------------------|      owners      |                  |
         |                   |  (Role Table)    |                  |
         |                   +------------------+                  |
         |                            ^                            |
         |                            |                            |
+------------------+         +------------------+                  |
|   interactions   |         |    properties    | <----------------+
|  (Calls/Messages)|         |  (Listings)      |
+------------------+         +------------------+
         |                            ^
         +----------------------------+
```

---

## Detailed Entity Definitions

### 1. `users`
System administrative and agent user accounts.
* `id` (UUID, Primary Key)
* `email` (TEXT, Unique, Indexed)
* `password_hash` (TEXT, Not Null)
* `full_name` (TEXT, Not Null)
* `role` (TEXT, Default: 'AGENT')
* `is_active` (BOOLEAN, Default: true)
* `created_at` (TEXT / Timestamptz)
* `updated_at` (TEXT / Timestamptz)

### 2. `contacts` (Canonical Person)
The single source of truth for individual identity.
* `id` (UUID, Primary Key)
* `phone_raw` (TEXT, Not Null)
* `phone_normalized` (TEXT, Unique, Indexed, E.164 Standard)
* `first_name` (TEXT)
* `last_name` (TEXT)
* `email` (TEXT)
* `address` (TEXT)
* `notes` (TEXT)
* `is_verified_manually` (BOOLEAN, Default: false)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 3. `customers` (Role Table)
Role record for prospective tenants and buyers linked to `contacts`.
* `id` (UUID, Primary Key)
* `contact_id` (UUID, Foreign Key -> `contacts.id`, On Delete: CASCADE, Indexed)
* `customer_type` (TEXT, Default: 'TENANT') -- TENANT, BUYER, BOTH
* `status` (TEXT, Default: 'ACTIVE')
* `notes` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 4. `owners` (Role Table)
Role record for property landlords and owners linked to `contacts`.
* `id` (UUID, Primary Key)
* `contact_id` (UUID, Foreign Key -> `contacts.id`, On Delete: CASCADE, Indexed)
* `tax_id` (TEXT)
* `company_name` (TEXT)
* `notes` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 5. `properties`
Real estate listings belonging to an owner.
* `id` (UUID, Primary Key)
* `owner_id` (UUID, Foreign Key -> `owners.id`, On Delete: RESTRICT, Indexed)
* `title` (TEXT, Not Null)
* `description` (TEXT)
* `property_type` (TEXT, Not Null) -- APARTMENT, VILLA, STUDIO, COMMERCIAL, LAND
* `listing_type` (TEXT, Not Null) -- RENT, SALE, BOTH
* `address` (TEXT, Not Null)
* `city` (TEXT, Not Null, Composite Index with property_type)
* `state` (TEXT)
* `zip_code` (TEXT)
* `bedrooms` (INTEGER, Default: 0)
* `bathrooms` (REAL, Default: 0)
* `square_feet` (REAL)
* `furnishing_status` (TEXT, Default: 'UNFURNISHED')
* `monthly_rent` (REAL)
* `sale_price` (REAL)
* `deposit_amount` (REAL)
* `status` (TEXT, Default: 'AVAILABLE', Indexed)
* `is_verified_manually` (BOOLEAN, Default: false)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 6. `property_media`
Photos, videos, and floorplans for properties.
* `id` (UUID, Primary Key)
* `property_id` (UUID, Foreign Key -> `properties.id`, On Delete: CASCADE, Indexed)
* `media_type` (TEXT, Default: 'IMAGE')
* `url` (TEXT, Not Null)
* `caption` (TEXT)
* `display_order` (INTEGER, Default: 0)
* `created_at` (TEXT)

### 7. `requirements`
Rental or purchase requirements submitted by customers.
* `id` (UUID, Primary Key)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: CASCADE, Indexed)
* `intent` (TEXT, Not Null) -- RENT, BUY
* `property_type` (TEXT)
* `min_bedrooms` (INTEGER)
* `min_bathrooms` (REAL)
* `preferred_cities` (TEXT / JSON)
* `preferred_locations` (TEXT / JSON)
* `min_budget` (REAL)
* `max_budget` (REAL)
* `furnishing_status` (TEXT)
* `move_in_date` (TEXT)
* `notes` (TEXT)
* `is_active` (BOOLEAN, Default: true)
* `is_verified_manually` (BOOLEAN, Default: false)
* `source_record_id` (UUID, Foreign Key -> `source_records.id`, On Delete: SET NULL)
* `extraction_confidence` (REAL)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 8. `leads`
Business pipeline opportunities matching customers and properties.
* `id` (UUID, Primary Key)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: CASCADE, Indexed)
* `requirement_id` (UUID, Foreign Key -> `requirements.id`, On Delete: SET NULL)
* `matched_property_id` (UUID, Foreign Key -> `properties.id`, On Delete: SET NULL)
* `assigned_user_id` (UUID, Foreign Key -> `users.id`, On Delete: SET NULL)
* `stage` (TEXT, Default: 'NEW', Indexed)
* `priority` (TEXT, Default: 'MEDIUM')
* `score` (INTEGER, Default: 0)
* `lost_reason` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 9. `source_records`
Immutable landing log for all raw incoming messages, call logs, audio, or forms.
* `id` (UUID, Primary Key)
* `source_type` (TEXT, Not Null, Indexed) -- WHATSAPP, CALL_LOG, RECORDING, MANUAL
* `external_id` (TEXT, Indexed)
* `sender_identifier` (TEXT)
* `payload` (TEXT / JSON, Not Null)
* `media_url` (TEXT)
* `checksum` (TEXT)
* `created_at` (TEXT)

### 10. `interactions`
Unified communication ledger.
* `id` (UUID, Primary Key)
* `contact_id` (UUID, Foreign Key -> `contacts.id`, On Delete: CASCADE, Indexed)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: SET NULL, Indexed)
* `lead_id` (UUID, Foreign Key -> `leads.id`, On Delete: SET NULL, Indexed)
* `source_record_id` (UUID, Foreign Key -> `source_records.id`, On Delete: SET NULL)
* `channel` (TEXT, Not Null) -- WHATSAPP, CALL, IN_PERSON, EMAIL, MANUAL_NOTE
* `direction` (TEXT, Not Null) -- INBOUND, OUTBOUND
* `summary` (TEXT)
* `sentiment` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 11. `messages`
Detail record for text/WhatsApp messages.
* `id` (UUID, Primary Key)
* `interaction_id` (UUID, Foreign Key -> `interactions.id`, On Delete: CASCADE, Indexed)
* `external_id` (TEXT)
* `sender_phone` (TEXT, Not Null)
* `recipient_phone` (TEXT, Not Null)
* `message_type` (TEXT, Default: 'TEXT')
* `body` (TEXT)
* `media_url` (TEXT)
* `status` (TEXT, Default: 'DELIVERED')
* `created_at` (TEXT)

### 12. `calls`
Detail record for phone calls and transcripts.
* `id` (UUID, Primary Key)
* `interaction_id` (UUID, Foreign Key -> `interactions.id`, On Delete: CASCADE, Indexed)
* `external_call_sid` (TEXT)
* `from_number` (TEXT, Not Null)
* `to_number` (TEXT, Not Null)
* `duration_seconds` (INTEGER, Default: 0)
* `call_status` (TEXT, Not Null)
* `recording_url` (TEXT)
* `transcript` (TEXT)
* `created_at` (TEXT)

### 13. `visits`
Scheduled property viewing appointments.
* `id` (UUID, Primary Key)
* `property_id` (UUID, Foreign Key -> `properties.id`, On Delete: RESTRICT, Indexed)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: CASCADE, Indexed)
* `lead_id` (UUID, Foreign Key -> `leads.id`, On Delete: SET NULL)
* `scheduled_start` (TEXT, Not Null)
* `scheduled_end` (TEXT, Not Null)
* `status` (TEXT, Default: 'SCHEDULED')
* `feedback` (TEXT)
* `rating` (INTEGER)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 14. `transactions`
Lease agreements and property sales.
* `id` (UUID, Primary Key)
* `property_id` (UUID, Foreign Key -> `properties.id`, On Delete: RESTRICT, Indexed)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: RESTRICT, Indexed)
* `owner_id` (UUID, Foreign Key -> `owners.id`, On Delete: RESTRICT, Indexed)
* `lead_id` (UUID, Foreign Key -> `leads.id`, On Delete: SET NULL)
* `transaction_type` (TEXT, Not Null) -- LEASE, SALE
* `amount` (REAL, Not Null)
* `deposit_paid` (REAL, Default: 0)
* `start_date` (TEXT)
* `end_date` (TEXT)
* `status` (TEXT, Default: 'PENDING')
* `contract_url` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 15. `followups`
Agent task reminders and follow-up activities.
* `id` (UUID, Primary Key)
* `lead_id` (UUID, Foreign Key -> `leads.id`, On Delete: CASCADE, Indexed)
* `customer_id` (UUID, Foreign Key -> `customers.id`, On Delete: CASCADE)
* `assigned_user_id` (UUID, Foreign Key -> `users.id`, On Delete: SET NULL)
* `due_date` (TEXT, Not Null, Composite Index with status)
* `reminder_type` (TEXT, Not Null)
* `status` (TEXT, Default: 'PENDING')
* `notes` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### 16. `extraction_runs`
AI extraction execution log.
* `id` (UUID, Primary Key)
* `source_record_id` (UUID, Foreign Key -> `source_records.id`, On Delete: CASCADE, Indexed)
* `provider_name` (TEXT, Not Null) -- OpenAI, Gemini, OpenRouter
* `model_name` (TEXT, Not Null)
* `overall_confidence` (REAL, Not Null)
* `raw_extraction_result` (TEXT / JSON, Not Null)
* `status` (TEXT, Default: 'AUTO_COMMITTED') -- AUTO_COMMITTED, PENDING_HUMAN_REVIEW, REJECTED
* `created_at` (TEXT)

### 17. `audit_logs`
Immutable compliance audit log.
* `id` (UUID, Primary Key)
* `table_name` (TEXT, Not Null)
* `record_id` (TEXT, Not Null)
* `action` (TEXT, Not Null) -- INSERT, UPDATE, DELETE
* `performed_by` (TEXT, Not Null) -- USER_ID or SYSTEM_AI
* `old_values` (TEXT / JSON)
* `new_values` (TEXT / JSON)
* `created_at` (TEXT, Indexed with table_name & record_id)
