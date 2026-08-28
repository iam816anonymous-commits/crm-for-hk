import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. users
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('AGENT'), // ADMIN, AGENT, MANAGER
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('idx_users_email').on(table.email),
]);

// 2. contacts (Canonical person record)
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  phoneRaw: text('phone_raw').notNull(),
  phoneNormalized: text('phone_normalized').notNull().unique(), // E.164 format, unique constraint
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  isVerifiedManually: integer('is_verified_manually', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex('idx_contacts_phone_normalized').on(table.phoneNormalized),
]);

// 3. customers (Role table referencing canonical contact)
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  customerType: text('customer_type').notNull().default('TENANT'), // TENANT, BUYER, BOTH
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, BLACKLISTED
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_customers_contact_id').on(table.contactId),
]);

// 4. owners (Role table referencing canonical contact)
export const owners = sqliteTable('owners', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  taxId: text('tax_id'),
  companyName: text('company_name'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_owners_contact_id').on(table.contactId),
]);

// 5. properties (Belongs to owner/contact)
export const properties = sqliteTable('properties', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id').notNull().references(() => owners.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  description: text('description'),
  propertyType: text('property_type').notNull(), // APARTMENT, VILLA, STUDIO, COMMERCIAL, LAND
  listingType: text('listing_type').notNull(), // RENT, SALE, BOTH
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state'),
  zipCode: text('zip_code'),
  bedrooms: integer('bedrooms').default(0), // BHK
  bathrooms: real('bathrooms').default(0),
  squareFeet: real('square_feet'),
  furnishingStatus: text('furnishing_status').default('UNFURNISHED'), // FURNISHED, SEMI_FURNISHED, UNFURNISHED
  monthlyRent: real('monthly_rent'),
  salePrice: real('sale_price'),
  depositAmount: real('deposit_amount'),
  maintenanceAmount: real('maintenance_amount').default(0), // Phase 3 field
  availableFrom: text('available_from'), // Phase 3 field
  photos: text('photos').default('[]'), // Phase 3 JSON array string
  status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, OCCUPIED, RESERVED
  isVerifiedManually: integer('is_verified_manually', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_properties_owner_id').on(table.ownerId),
  index('idx_properties_status').on(table.status),
  index('idx_properties_city_type').on(table.city, table.propertyType),
]);

// 6. property_media
export const propertyMedia = sqliteTable('property_media', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  mediaType: text('media_type').notNull().default('IMAGE'), // IMAGE, VIDEO, DOCUMENT
  url: text('url').notNull(),
  caption: text('caption'),
  displayOrder: integer('display_order').default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_property_media_property_id').on(table.propertyId),
]);

// 7. requirements (Belongs to customer/contact)
export const requirements = sqliteTable('requirements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  intent: text('intent').notNull(), // RENT, BUY
  propertyType: text('property_type'), // APARTMENT, VILLA, STUDIO, COMMERCIAL
  minBedrooms: integer('min_bedrooms'), // BHK
  minBathrooms: real('min_bathrooms'),
  preferredCities: text('preferred_cities'), // JSON array string
  preferredLocations: text('preferred_locations'), // JSON array string
  minBudget: real('min_budget'),
  maxBudget: real('max_budget'),
  furnishingStatus: text('furnishing_status'),
  moveInDate: text('move_in_date'),
  occupancyType: text('occupancy_type'), // FAMILY, BACHELOR, COMPANY, ANY (Phase 3 field)
  specialRequirements: text('special_requirements'), // Phase 3 field
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isVerifiedManually: integer('is_verified_manually', { mode: 'boolean' }).notNull().default(false),
  sourceRecordId: text('source_record_id').references(() => sourceRecords.id, { onDelete: 'set null' }),
  extractionConfidence: real('extraction_confidence'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_requirements_customer_id').on(table.customerId),
]);

// 8. leads (Full Phase 3 pipeline)
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  requirementId: text('requirement_id').references(() => requirements.id, { onDelete: 'set null' }),
  matchedPropertyId: text('matched_property_id').references(() => properties.id, { onDelete: 'set null' }),
  assignedUserId: text('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  // Phase 3 Pipeline Stages: NEW, CONTACTED, QUALIFIED, PROPERTIES_SENT, VISIT_SCHEDULED, VISITED, NEGOTIATION, CLOSED, LOST, NOT_INTERESTED, ON_HOLD
  stage: text('stage').notNull().default('NEW'),
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
  score: integer('score').default(0),
  lostReason: text('lost_reason'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_leads_customer_id').on(table.customerId),
  index('idx_leads_stage').on(table.stage),
]);

// 9. source_records (Preserves raw incoming metadata)
export const sourceRecords = sqliteTable('source_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceType: text('source_type').notNull(), // WHATSAPP, CALL_LOG, RECORDING, MANUAL
  externalId: text('external_id'),
  senderIdentifier: text('sender_identifier'),
  payload: text('payload').notNull(), // Raw JSON payload
  mediaUrl: text('media_url'),
  checksum: text('checksum'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_source_records_type').on(table.sourceType),
  index('idx_source_records_external_id').on(table.externalId),
]);

// 10. interactions (Unified ledger for calls, messages, manual notes)
export const interactions = sqliteTable('interactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  sourceRecordId: text('source_record_id').references(() => sourceRecords.id, { onDelete: 'set null' }),
  channel: text('channel').notNull(), // WHATSAPP, CALL, IN_PERSON, EMAIL, MANUAL_NOTE
  direction: text('direction').notNull(), // INBOUND, OUTBOUND
  summary: text('summary'),
  sentiment: text('sentiment'), // POSITIVE, NEUTRAL, NEGATIVE
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_interactions_contact_id').on(table.contactId),
  index('idx_interactions_customer_id').on(table.customerId),
  index('idx_interactions_lead_id').on(table.leadId),
]);

// 11. messages (Detail for message interaction)
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  interactionId: text('interaction_id').notNull().references(() => interactions.id, { onDelete: 'cascade' }),
  externalId: text('external_id'),
  senderPhone: text('sender_phone').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  messageType: text('message_type').notNull().default('TEXT'), // TEXT, IMAGE, AUDIO, DOCUMENT
  body: text('body'),
  mediaUrl: text('media_url'),
  status: text('status').notNull().default('DELIVERED'), // SENT, DELIVERED, READ, FAILED
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_messages_interaction_id').on(table.interactionId),
]);

// 12. calls (Detail for call interaction)
export const calls = sqliteTable('calls', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  interactionId: text('interaction_id').notNull().references(() => interactions.id, { onDelete: 'cascade' }),
  externalCallSid: text('external_call_sid').unique(),
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  callStatus: text('call_status').notNull(), // COMPLETED, BUSY, NO_ANSWER, FAILED, MISSED
  recordingUrl: text('recording_url'),
  transcript: text('transcript'),
  deviceId: text('device_id'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_calls_interaction_id').on(table.interactionId),
  uniqueIndex('idx_calls_external_sid').on(table.externalCallSid),
  index('idx_calls_from_to').on(table.fromNumber, table.toNumber),
]);

// 13. visits (Property viewings)
export const visits = sqliteTable('visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'restrict' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  scheduledStart: text('scheduled_start').notNull(),
  scheduledEnd: text('scheduled_end').notNull(),
  status: text('status').notNull().default('SCHEDULED'), // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
  feedback: text('feedback'),
  rating: integer('rating'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_visits_property_id').on(table.propertyId),
  index('idx_visits_customer_id').on(table.customerId),
]);

// 14. transactions (Leases or Sales)
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'restrict' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  ownerId: text('owner_id').notNull().references(() => owners.id, { onDelete: 'restrict' }),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  transactionType: text('transaction_type').notNull(), // LEASE, SALE
  amount: real('amount').notNull(),
  depositPaid: real('deposit_paid').default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('PENDING'), // PENDING, ACTIVE, COMPLETED, CANCELLED
  contractUrl: text('contract_url'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_transactions_property_id').on(table.propertyId),
  index('idx_transactions_customer_id').on(table.customerId),
  index('idx_transactions_owner_id').on(table.ownerId),
]);

// 15. followups (Tasks & Reminders)
export const followups = sqliteTable('followups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  assignedUserId: text('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  dueDate: text('due_date').notNull(),
  reminderType: text('reminder_type').notNull(), // SEND_WHATSAPP, CALL_CUSTOMER, SCHEDULE_VISIT
  status: text('status').notNull().default('PENDING'), // PENDING, COMPLETED, OVERDUE, CANCELLED
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_followups_due_date').on(table.dueDate, table.status),
  index('idx_followups_lead_id').on(table.leadId),
]);

// 16. extraction_runs (Tracks AI model extraction operations & confidence scores)
export const extractionRuns = sqliteTable('extraction_runs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceRecordId: text('source_record_id').notNull().references(() => sourceRecords.id, { onDelete: 'cascade' }),
  providerName: text('provider_name').notNull(), // OpenAI, Gemini, OpenRouter
  modelName: text('model_name').notNull(),
  overallConfidence: real('overall_confidence').notNull(),
  rawExtractionResult: text('raw_extraction_result').notNull(), // Full AI JSON string
  status: text('status').notNull().default('AUTO_COMMITTED'), // AUTO_COMMITTED, PENDING_HUMAN_REVIEW, REJECTED
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_extraction_runs_source_record_id').on(table.sourceRecordId),
]);

// 17. audit_logs (System change history)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(), // INSERT, UPDATE, DELETE
  performedBy: text('performed_by').notNull(), // USER_ID or SYSTEM_AI
  oldValues: text('old_values'), // JSON string
  newValues: text('new_values'), // JSON string
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index('idx_audit_logs_record').on(table.tableName, table.recordId),
]);
