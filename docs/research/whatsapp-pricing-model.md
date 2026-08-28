# WhatsApp Business Platform Pricing & Cost Observation Model

## Executive Summary
This document details Meta's official conversation-based pricing model for the WhatsApp Business Cloud API (specifically focusing on India INR rates) and defines the database architecture for the internal `whatsapp_usage` cost observation model.

---

## 1. Meta WhatsApp Business Cloud API Pricing Model

### 1.1 Conversation-Based Pricing Concept
Meta charges for WhatsApp Business messaging based on 24-hour **Conversations**, rather than per-individual message. A single conversation window opens when the first message is delivered and lasts for 24 hours. All subsequent messages of the same category exchanged within that 24-hour window incur no additional Meta charges.

### 1.2 Conversation Categories & Rates (India - INR)
*Rates are configured dynamically in system settings to account for Meta price updates.*

| Conversation Category | Description | Initiator | Estimated Rate Range (INR / Conversation) |
| :--- | :--- | :--- | :---: |
| **Service** | User-initiated customer support threads | Customer | ₹0.29 – ₹0.35 |
| **Utility** | Order confirmation, visit schedules, lease updates | Business | ₹0.12 – ₹0.15 |
| **Marketing** | Promotions, property alerts, recommendations | Business | ₹0.72 – ₹0.85 |
| **Authentication** | One-Time Passwords (OTPs) | Business | ₹0.12 – ₹0.15 |

### 1.3 Free Tier & Service Allowances
* **1,000 Free Service Conversations**: Each WhatsApp Business Account (WABA) receives 1,000 free **Service** conversations per month.
* **Free Entry Point Conversations**: Conversations initiated from Meta Click-to-WhatsApp Ads or Facebook Page CTA buttons are free for 72 hours.

---

## 2. Internal Cost Observation Database Model (`whatsapp_usage`)

To calculate communication costs without hardcoding Meta prices into business logic, we design a dedicated `whatsapp_usage` cost tracking table.

### 2.1 Proposed Drizzle Schema Definition

```typescript
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const whatsappUsage = sqliteTable('whatsapp_usage', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id').notNull().unique(), // wamid
  wabaId: text('waba_id').notNull(),
  phoneNumber: text('phone_number').notNull(), // E.164 format
  direction: text('direction').notNull(), // INBOUND, OUTBOUND
  category: text('category').notNull(), // SERVICE, UTILITY, MARKETING, AUTHENTICATION
  templateName: text('template_name'),
  conversationId: text('conversation_id'), // Meta conversation reference ID
  estimatedCost: real('estimated_cost').notNull().default(0.0), // Calculated cost (e.g., 0.72)
  currency: text('currency').notNull().default('INR'),
  pricingStatus: text('pricing_status').notNull().default('ESTIMATED'), // ESTIMATED, BILLED, FREE_TIER
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_whatsapp_usage_phone').on(table.phoneNumber),
  index('idx_whatsapp_usage_category').on(table.category),
  index('idx_whatsapp_usage_conversation').on(table.conversationId),
]);
```

### 2.2 Dynamic Price Config Model
Cost calculation uses configurable rate settings:

```typescript
export const WABA_PRICING_RATES_INR = {
  SERVICE: 0.32,
  UTILITY: 0.14,
  MARKETING: 0.78,
  AUTHENTICATION: 0.14,
};
```

---

## 3. Webhook Pricing Metadata Ingestion
Meta's webhook status updates deliver `pricing` objects in payload notifications:

```json
{
  "id": "wamid.HBgLMTIzNDU2Nzg5MA==",
  "status": "delivered",
  "pricing": {
    "billable": true,
    "pricing_model": "CBP",
    "category": "marketing"
  },
  "conversation": {
    "id": "CONVERSATION_ID_12345",
    "expiration_timestamp": "1787900000"
  }
}
```

Upon receiving a status update webhook, `DomainService` updates `whatsapp_usage` records with actual Meta category and billing metadata.
