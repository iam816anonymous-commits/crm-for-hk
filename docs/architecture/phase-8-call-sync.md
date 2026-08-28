# Phase 8 Architecture: Android Call Log Companion App & Privacy Sync

## 1. System Overview
The Android Call Log Companion App bridges physical PSTN phone calls handled on property field agent devices with the central Rental Property CRM. It operates under a strict privacy-first model, transmitting only phone call metadata (E.164 normalized phone numbers, timestamp, duration, call direction, and status) without accessing or transmitting call audio recordings.

```
+-----------------------------+               +----------------------------------+
|    Android Device           |               |       CRM Backend Server         |
|                             |               |                                  |
|  [ CallLog Provider ]       |               |  POST /api/calls/log             |
|          |                  |               |        |                         |
|  [ CallLogReader ]          |               |  [ Bearer Token Auth ]           |
|          |                  |  HTTPS POST   |        |                         |
|  [ E.164 Normalizer ]       | ------------> |  [ Zod Schema Validation ]       |
|          |                  |  Bearer Token |        |                         |
|  [ CallSyncWorker ]         |               |  [ E.164 Contact Match / Upsert ]|
|  (WorkManager Background)   |               |        |                         |
|          |                  |               |  [ DB Idempotency Check ]        |
|  [ SharedPreferences Cache ]|               |        |                         |
|  (Deduplication Hash Set)   |               |  [ Interactions & Audit Log ]    |
+-----------------------------+               +----------------------------------+
```

---

## 2. Key Architecture Principles

### 2.1 Decoupled Client-Side Ingestion Architecture
* **`PermissionActivity.kt`**: UI component providing transparent rationale disclosure explaining why `READ_CALL_LOG` permission is required and displaying a strict privacy guarantee.
* **`CallLogReader.kt`**: Queries Android `CallLog.Calls` provider for basic call metadata. Computes a deterministic SHA-256 hash `externalCallSid` per call record (`android_${rawId}_${number}_${timestamp}`).
* **`PhoneNumberNormalizer.kt`**: Client-side E.164 phone standardization utility.
* **`CallSyncWorker.kt`**: Android `CoroutineWorker` executed periodically via Android WorkManager. Implements local cache filtering to prevent duplicate API uploads, attaches Bearer Token authentication headers, and handles HTTP retries safely.

### 2.2 Backend Ingestion & Idempotency (`POST /api/calls/log`)
* **Authentication**: Enforces HTTP Bearer Token authentication header (`Authorization: Bearer <COMPANION_API_TOKEN>`).
* **Validation**: Enforces strict Zod schema validation (`IngestCallLogSchema`).
* **Canonical Contact Matching**: Normalizes counterparty phone numbers to E.164 format and resolves or automatically creates canonical contact records.
* **Database Idempotency**: Checks `calls.externalCallSid` against SQLite database unique index `idx_calls_external_sid`. Returns HTTP `409 Conflict` if duplicate upload occurs.
* **Audit Trail**: Writes an immutable transaction record to `audit_logs` table with `performedBy = 'ANDROID_COMPANION_APP'`.
