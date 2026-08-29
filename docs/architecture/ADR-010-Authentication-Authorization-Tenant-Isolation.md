# ADR-010: Authentication, Authorization, RBAC, Tenant Isolation & Demo Data Removal

## Status
Accepted

## Context
The Rental Property CRM system previously operated as a Phase 0–9 prototype with mock demo records (e.g. "Ravi Kumar") embedded across frontend views and unauthenticated backend REST endpoints. To convert this system into a real multi-tenant CRM foundation suitable for commercial deployment, we must enforce server-side security boundaries:

1. Secure password storage and session management.
2. Organization/Tenant data isolation across all CRM entities (`contacts`, `properties`, `requirements`, `leads`, `interactions`, etc.).
3. Server-side Role-Based Access Control (RBAC) supporting `ADMIN`, `BROKER`, `STAFF`, and `VIEWER` roles.
4. Protection against Insecure Direct Object References (IDOR).
5. Preservation of external integration auth mechanisms (Meta WhatsApp HMAC SHA-256 signatures, Android Companion Bearer token).
6. Complete removal of hardcoded production frontend demo data dependencies.

## Decision
We implement a native server-side authentication and tenant isolation architecture using Node.js `crypto.scrypt` password hashing, JWT session tokens, and Drizzle ORM database row-level `organizationId` scoping:

### 1. Account & Multi-Tenant Model
- **Organizations**: Created via `POST /api/auth/register-org`.
- **Users**: Identified by `email` and bound to an `organizationId`. A `USER` represents an application operator (agent/broker), distinct from a CRM `CONTACT`.
- **Invitations**: Admins invite team members via `POST /api/auth/invitation`. Invited users complete onboarding via `POST /api/auth/accept-invitation`.
- **Tenant Scope**: Every CRM record table contains an indexed `organizationId` column.

### 2. Password & Session Security
- Passwords are hashed using Node's native `crypto.scrypt` with a 16-byte random salt and 64-byte key length (`salt:derivedKey` format). Plaintext passwords are never logged or stored.
- Sessions are backed by JWT tokens and persisted in the `sessions` table (`userId`, `token`, `expiresAt`) allowing server-side token revocation and expiry checks upon every request.

### 3. API Authorization & RBAC Middleware
- **PUBLIC**: `/health`, `POST /api/auth/register-org`, `POST /api/auth/login`, `POST /api/auth/accept-invitation`.
- **EXTERNAL_WEBHOOK**: `GET/POST /api/whatsapp/webhook` (Meta HMAC SHA-256 signature / verify token), `POST /api/calls/telephony-webhook`.
- **COMPANION_APP**: `POST /api/calls/log` (Companion API Bearer token).
- **AUTHENTICATED CRM APIs**: Require valid JWT token in `Authorization: Bearer <token>` header or `session_token` HTTP-only cookie.
  - `ADMIN`: Full organization and user management access + full CRM access.
  - `BROKER` & `STAFF`: CRM operational access (create/update contacts, properties, requirements, leads, call intelligence, verification queue).
  - `VIEWER`: Read-only access to CRM records. Rejects write attempts (`POST`, `PATCH`, `PUT`, `DELETE`) with HTTP 403 Forbidden.

### 4. Database Boundary IDOR Protection
All database queries in `DomainService` and `DashboardService` enforce filtering at the query level:
```ts
WHERE id = requestedId AND organization_id = authenticatedUser.organizationId
```
Requests attempting to fetch or modify entity IDs belonging to a different organization return HTTP 404 Not Found / HTTP 403 Forbidden. Frontend filtering is never relied upon for security.

### 5. Demo Data Cleanup & Fresh Database Policy
- Production frontend views obtain data strictly from authenticated API responses.
- Clean empty states ("No contacts yet", "No properties found", etc.) render when database tables are empty.
- An optional development CLI seed script (`npm run db:seed`) is provided for local setup, but is never run automatically on application startup or migrations.

## Consequences
- **Positive**: Strict server-side security, complete IDOR prevention, authenticated multi-tenant isolation, clean fresh database operation, and preserved WhatsApp/Android integrations.
- **Trade-offs**: Local integration testing requires generating valid session tokens or auth test fixtures using `createTestAuthUser`.
