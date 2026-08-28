# WhatsApp Business Platform & Cloud API Architectural Audit

## Executive Summary
This document provides an audit of Meta's official WhatsApp Business Cloud API capabilities, messaging models, authentication protocols, rate limits, India-specific pricing considerations, and webhook reliability requirements for integration into the **Rental Property CRM & Communication Intelligence System**.

---

## 1. Official WhatsApp Business Cloud API Capabilities

### 1.1 Messaging Model & Conversation Windows
* **24-Hour Customer Service Window**: When a customer sends an inbound message to the business WABA (WhatsApp Business Account), a 24-hour session window opens. Within this window, the business can send free-form text messages and media responses without requiring pre-approved message templates.
* **Template Messages (Outbound Initiated by Business)**: Outside the 24-hour window, or to initiate a new conversation with a customer, businesses **MUST** use Meta pre-approved Message Templates. Attempts to send free-form messages outside the 24-hour window fail with Error `131047` (*"Re-engagement message specified an invalid template"*).

### 1.2 Message Categories & Conversation Types
Meta classifies all WhatsApp Business conversations into 4 distinct categories:

1. **Service Conversations**: User-initiated messaging threads. Allows free-form responses during the 24-hour customer service window.
2. **Marketing Conversations**: Business-initiated threads containing promotions, property recommendations, or general announcements.
3. **Utility Conversations**: Business-initiated transactional updates (e.g., property visit confirmation, lease agreement updates, payment receipts).
4. **Authentication Conversations**: Business-initiated one-time passcodes (OTPs) for user authentication.

### 1.3 Supported Message & Media Types
* **Text**: Standard text formatting (bold `*`, italic `_`, strikethrough `~`, code ```).
* **Media**: Images (`image/jpeg`, `image/png`), Audio (`audio/aac`, `audio/mp4`, `audio/mpeg`, `audio/ogg; codecs=opus`), Documents (`application/pdf`), Video (`video/mp4`).
* **Interactive Messages**: Quick Reply Buttons (up to 3 buttons), List Messages (up to 10 options in a structured menu), CTA Url / Call Buttons.
* **Location**: Share and ingest latitude/longitude coordinates (useful for property location sharing).

### 1.4 Webhook Architecture & Reliability Requirements
* **Verification Handshake**: Meta issues a `GET` request with query parameters (`hub.mode`, `hub.verify_token`, `hub.challenge`). The server must respond with `200 OK` and echo `hub.challenge`.
* **Signature Verification (`X-Hub-Signature-256`)**: Meta sends an SHA-256 HMAC signature in the `X-Hub-Signature-256` HTTP header generated using the Meta App Secret. The CRM application MUST validate this signature to prevent payload spoofing.
* **200 OK Acknowledgement**: The webhook endpoint must return a `200 OK` HTTP status within **3 seconds**. If the endpoint times out or returns non-2xx status, Meta retries delivery with exponential backoff for up to 24 hours. Heavy processing (AI extraction, DB insertion) MUST occur asynchronously or within transaction blocks that return immediately.
* **Idempotency & Message Deduplication**: Webhook retries send duplicate payloads with identical `wamid` (WhatsApp Message ID). The system MUST deduplicate by `wamid` before executing business logic.

---

## 2. Technical & Legal Realities: Personal WhatsApp vs Official WABA

| Feature / Capability | Normal Personal WhatsApp Account | Official WhatsApp Business Cloud API (WABA) |
| :--- | :---: | :---: |
| **Official Webhook Ingestion** | **NOT SUPPORTED** | **FULLY SUPPORTED** |
| **Automated Outbound API** | **NOT SUPPORTED** (Account Ban Risk) | **OFFICIALLY SUPPORTED** |
| **Multi-Agent Access** | Restricted to Web/Desktop link (4 devices) | Unlimited Concurrent Agents via CRM |
| **Web Scraping / Puppeteer** | **BANNED BY META TOS** | N/A |
| **Message Templates** | Not available | Pre-approved templates with dynamic parameters |
| **Enterprise SLA & Rate Limits** | None | 80 to 1,000+ messages/sec (Tiered) |

> **CRITICAL DIRECTIVE**: Unofficial WhatsApp Web scraping or reverse-engineered APIs (e.g., Baileys, whatsapp-web.js) **MUST NOT** be used. They violate Meta Terms of Service and result in permanent phone number bans. All CRM communication MUST use the official Meta WhatsApp Business Cloud API.

---

## 3. Webhook Security & Idempotency Rules

1. **HMAC Signature Validation**: Verify `X-Hub-Signature-256` using Meta App Secret.
2. **Raw Payload Preservation**: Save raw webhook JSON payloads in `source_records` table with `source_type = 'WHATSAPP'` and `external_id = wamid`.
3. **Idempotency Check**: Query `messages` table for existing `external_id == wamid`. If present, log warning and return `200 OK` immediately without duplicate processing.
4. **Transaction Rollback Safety**: Perform contact lookup/creation, interaction insertion, and message record creation inside an isolated database transaction block.
