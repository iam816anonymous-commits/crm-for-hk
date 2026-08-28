# Rental CRM Gap Analysis & Domain Model Verification

## Executive Summary
This document provides a gap analysis comparing generic CRM capabilities against the **Rental Property CRM & Communication Intelligence System**. It explicitly verifies our 18 core domain entities, evaluates specialized rental business requirements (e.g., BHK preferences, deposit amounts, property viewing schedules, lease transactions), and identifies capability gaps requiring architecture enhancements.

---

## 1. Domain Entity Audit & Support Verification

| Core Domain Entity | System Table | Verified Status | Key Schema Attributes & Capabilities |
| :--- | :--- | :---: | :--- |
| **1. Contacts** | `contacts` | **SUPPORTED** | Canonical identity, `phone_raw`, `phone_normalized` (E.164 unique index), `first_name`, `last_name`, `email`, `is_verified_manually`. |
| **2. Customers** | `customers` | **SUPPORTED** | Role table linked to `contacts.id`, `customer_type` ('TENANT', 'BUYER', 'BOTH'), `status` ('ACTIVE', 'INACTIVE', 'BLACKLISTED'). |
| **3. Owners** | `owners` | **SUPPORTED** | Role table linked to `contacts.id`, `tax_id`, `company_name`, `notes`. |
| **4. Properties** | `properties` | **SUPPORTED** | `owner_id`, `title`, `property_type`, `listing_type`, `address`, `city`, `bedrooms` (BHK), `bathrooms`, `monthly_rent`, `deposit_amount`, `maintenance_amount`, `available_from`. |
| **5. Property Media** | `property_media` | **SUPPORTED** | `property_id`, `media_type` ('IMAGE', 'VIDEO', 'DOCUMENT'), `url`, `caption`, `display_order`. |
| **6. Requirements** | `requirements` | **SUPPORTED** | `customer_id`, `intent` ('RENT', 'BUY'), `property_type`, `min_bedrooms`, `preferred_cities`, `preferred_locations`, `min_budget`, `max_budget`, `move_in_date`, `occupancy_type`, `extraction_confidence`. |
| **7. Leads** | `leads` | **SUPPORTED** | Full 10-stage pipeline (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPERTIES_SENT`, `VISIT_SCHEDULED`, `VISITED`, `NEGOTIATION`, `CLOSED`, `LOST`, `NOT_INTERESTED`, `ON_HOLD`), `score`, `priority`, `lost_reason`. |
| **8. Interactions** | `interactions` | **SUPPORTED** | Unified ledger linking `contact_id`, `customer_id`, `lead_id`, `source_record_id`, `channel` ('WHATSAPP', 'CALL', 'IN_PERSON'), `direction` ('INBOUND', 'OUTBOUND'). |
| **9. Messages** | `messages` | **SUPPORTED** | `interaction_id`, `external_id`, `sender_phone`, `recipient_phone`, `message_type` ('TEXT', 'IMAGE', 'AUDIO'), `body`, `status`. |
| **10. Calls** | `calls` | **SUPPORTED** | `interaction_id`, `external_call_sid` (UNIQUE), `from_number`, `to_number`, `duration_seconds`, `call_status`, `device_id`. |
| **11. Visits** | `visits` | **SUPPORTED** | `property_id`, `customer_id`, `lead_id`, `scheduled_start`, `scheduled_end`, `status` ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'), `feedback`, `rating`. |
| **12. Transactions** | `transactions` | **SUPPORTED** | `property_id`, `customer_id`, `owner_id`, `transaction_type` ('LEASE', 'SALE'), `amount`, `deposit_paid`, `start_date`, `end_date`, `status` ('PENDING', 'ACTIVE', 'COMPLETED'). |
| **13. Follow-ups** | `followups` | **SUPPORTED** | `lead_id`, `customer_id`, `assigned_user_id`, `due_date`, `reminder_type`, `status` ('PENDING', 'COMPLETED', 'OVERDUE'). |
| **14. AI Extraction** | `extraction_runs` | **SUPPORTED** | 7-stage pipeline (`AIPipeline`), `source_record_id`, `provider_name`, `overall_confidence`, `raw_extraction_result`, `status`. |
| **15. Human Review** | Review Queue | **SUPPORTED** | `/api/reviews/pending`, `/api/reviews/:id/approve`, `/api/reviews/:id/reject`. Blocks low-confidence extractions from mutating CRM state (`isVerifiedManually = true`). |
| **16. Audit Logs** | `audit_logs` | **SUPPORTED** | System change history tracking `table_name`, `record_id`, `action`, `performed_by` ('USER_ID' or 'ANDROID_COMPANION_APP' or 'SYSTEM_AI'), `old_values`, `new_values`. |
| **17. Property Matching** | `MatchingEngine` | **SUPPORTED** | Deterministic 100-point scoring algorithm evaluating BHK (20%), Budget (20%), Location (30%), Availability (10%), Property Type (5%), Furnishing (10%), Special Rules (5%). |
| **18. Source Records** | `source_records` | **SUPPORTED** | Raw payload preservation table (`payload`, `source_type`, `external_id`, `sender_identifier`, `checksum`). |

---

## 2. Rental CRM Specialized Requirements vs Generic CRM Gaps

Standard generic CRMs (HubSpot, Salesforce, Zoho) focus on B2B deal pipelines with simple monetary deal sizes. Rental property businesses require specialized domain capabilities:

### 2.1 Deposit & Maintenance Cost Tracking (Rental Specific)
* **Requirement**: Rental listings in markets like India require tracking `monthly_rent`, `deposit_amount` (e.g., 6–10 months rent in Bangalore), and `maintenance_amount` (e.g. ₹3,500/month).
* **Gap Analysis**: Generic CRMs have only a single `deal_amount` field.
* **Our Status**: **SUPPORTED**. `properties` table includes distinct `monthly_rent`, `deposit_amount`, and `maintenance_amount` columns.

### 2.2 Property Viewing / Visit Scheduling Pipeline
* **Requirement**: Tenant leads move from digital inquiry to physical property viewings ("Visits"). Visit outcomes (Feedback, Rating, No-Show) directly drive lead stage transitions (`VISIT_SCHEDULED` → `VISITED`).
* **Gap Analysis**: Generic CRMs treat meetings as generic calendar events without property association or feedback scoring.
* **Our Status**: **SUPPORTED**. `visits` table explicitly references `property_id`, `customer_id`, `lead_id`, `feedback`, and `rating`.

### 2.3 Automated Property-to-Requirement Matching Engine
* **Requirement**: Agents managing hundreds of properties cannot manually cross-reference tenant requirements against available inventory.
* **Gap Analysis**: Generic CRMs lack native multi-attribute matching engines.
* **Our Status**: **SUPPORTED**. `MatchingEngine.ts` computes weighted compatibility scores (~94% score) matching BHK, location, budget, and move-in date.

### 2.4 WhatsApp Business Cloud API Communication Tracking
* **Requirement**: 90%+ of tenant and owner interactions in Indian real estate occur over WhatsApp. System must track WhatsApp message history, media attachments, and conversation categories.
* **Gap Analysis**: Generic CRMs rely on third-party SMS plugins without native Meta Cloud API webhook idempotency or cost observation models.
* **Our Status**: **SUPPORTED / EXPANDING IN PHASE 9**. Phase 9 will implement the `whatsapp_usage` cost observation model and HMAC signature verification.

---

## 3. Identified Functional Gaps & Action Items

| Gap Area | Description | Priority | Recommended Action |
| :--- | :--- | :---: | :--- |
| **WhatsApp Usage Cost Tracking** | Lack of normalized table tracking Meta WABA conversation categories (Marketing, Utility, Service) and estimated cost in INR. | **P0** | Add `whatsapp_usage` table in Phase 9 (`docs/research/whatsapp-pricing-model.md`). |
| **Webhook Signature Enforcement** | Missing `X-Hub-Signature-256` HMAC validation on inbound WhatsApp webhooks in production configuration. | **P0** | Implement Meta App Secret HMAC verification middleware in `src/whatsapp/routes.ts`. |
| **Automated SLA Escalation for Follow-ups** | Overdue follow-ups do not currently trigger notification banners or dashboard alerts. | **P1** | Add overdue task filter and SLA alert indicators to `DashboardService.ts` and `DashboardView.tsx`. |
| **Multi-Property Comparison Matrix** | Frontend lacks a side-by-side comparison matrix for property options sent to a tenant lead. | **P2** | Add visual property comparison modal to `MatchesView.tsx` in future iterations. |
