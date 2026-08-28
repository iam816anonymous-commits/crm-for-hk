# ADR 001: WhatsApp Cost Observation Model & Webhook Idempotency Architecture

## Status
**ACCEPTED**

## Context
In the Rental Property CRM & Communication Intelligence System, WhatsApp Business Cloud API serves as the primary communication channel with tenants, buyers, and property owners. Meta charges WABA messaging on a 24-hour conversation model across 4 distinct categories (Service, Utility, Marketing, Authentication) with variable rates per country (e.g., India INR pricing).

Furthermore, Meta Webhook delivery promises *at-least-once* delivery, leading to duplicate payload submissions during network retries. Processing duplicate webhooks causes duplicate contact records, phantom requirement extractions, and double-counted metrics.

## Decision

1. **Adopt Configurable Cost Observation Model (`whatsapp_usage`)**:
   * Create a dedicated `whatsapp_usage` cost tracking table storing message ID (`wamid`), phone number, category ('SERVICE', 'UTILITY', 'MARKETING', 'AUTHENTICATION'), template name, conversation ID, and calculated cost (`estimated_cost`).
   * Rates MUST remain fully configurable in system environment/settings without hardcoding monetary values into application business logic.

2. **Enforce Webhook Security & Idempotency Rules**:
   * Validate Meta `X-Hub-Signature-256` HMAC signatures using the Meta App Secret prior to processing POST requests.
   * Query database for existing `messages.externalId == wamid`. If present, immediately acknowledge with HTTP `200 OK` and skip processing.
   * Enforce synchronous SQLite database transaction blocks around contact resolution, raw payload preservation in `source_records`, interaction creation, and message insertion.
   * Always acknowledge Webhook requests with HTTP `200 OK` within 3 seconds to preserve Meta WABA account health.

## Consequences

* **Positive**:
  * Accurate real-time visibility into WABA messaging expenditure in INR.
  * Complete immunity against duplicate webhook submissions or network retries.
  * Zero risk of Meta WABA account suspension due to failed webhook delivery timeouts.

* **Negative**:
  * Minor database storage overhead for tracking conversation cost ledger entries.
