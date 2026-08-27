CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`action` text NOT NULL,
	`performed_by` text NOT NULL,
	`old_values` text,
	`new_values` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_record` ON `audit_logs` (`table_name`,`record_id`);--> statement-breakpoint
CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`interaction_id` text NOT NULL,
	`external_call_sid` text,
	`from_number` text NOT NULL,
	`to_number` text NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`call_status` text NOT NULL,
	`recording_url` text,
	`transcript` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`interaction_id`) REFERENCES `interactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_calls_interaction_id` ON `calls` (`interaction_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_raw` text NOT NULL,
	`phone_normalized` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`address` text,
	`notes` text,
	`is_verified_manually` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_phone_normalized_unique` ON `contacts` (`phone_normalized`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_contacts_phone_normalized` ON `contacts` (`phone_normalized`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`customer_type` text DEFAULT 'TENANT' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_customers_contact_id` ON `customers` (`contact_id`);--> statement-breakpoint
CREATE TABLE `extraction_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_record_id` text NOT NULL,
	`provider_name` text NOT NULL,
	`model_name` text NOT NULL,
	`overall_confidence` real NOT NULL,
	`raw_extraction_result` text NOT NULL,
	`status` text DEFAULT 'AUTO_COMMITTED' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_extraction_runs_source_record_id` ON `extraction_runs` (`source_record_id`);--> statement-breakpoint
CREATE TABLE `followups` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`assigned_user_id` text,
	`due_date` text NOT NULL,
	`reminder_type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_followups_due_date` ON `followups` (`due_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_followups_lead_id` ON `followups` (`lead_id`);--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`customer_id` text,
	`lead_id` text,
	`source_record_id` text,
	`channel` text NOT NULL,
	`direction` text NOT NULL,
	`summary` text,
	`sentiment` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_interactions_contact_id` ON `interactions` (`contact_id`);--> statement-breakpoint
CREATE INDEX `idx_interactions_customer_id` ON `interactions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_interactions_lead_id` ON `interactions` (`lead_id`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`requirement_id` text,
	`matched_property_id` text,
	`assigned_user_id` text,
	`stage` text DEFAULT 'NEW' NOT NULL,
	`priority` text DEFAULT 'MEDIUM' NOT NULL,
	`score` integer DEFAULT 0,
	`lost_reason` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requirement_id`) REFERENCES `requirements`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`matched_property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_leads_customer_id` ON `leads` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_leads_stage` ON `leads` (`stage`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`interaction_id` text NOT NULL,
	`external_id` text,
	`sender_phone` text NOT NULL,
	`recipient_phone` text NOT NULL,
	`message_type` text DEFAULT 'TEXT' NOT NULL,
	`body` text,
	`media_url` text,
	`status` text DEFAULT 'DELIVERED' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`interaction_id`) REFERENCES `interactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_interaction_id` ON `messages` (`interaction_id`);--> statement-breakpoint
CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`tax_id` text,
	`company_name` text,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_owners_contact_id` ON `owners` (`contact_id`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`property_type` text NOT NULL,
	`listing_type` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text,
	`zip_code` text,
	`bedrooms` integer DEFAULT 0,
	`bathrooms` real DEFAULT 0,
	`square_feet` real,
	`furnishing_status` text DEFAULT 'UNFURNISHED',
	`monthly_rent` real,
	`sale_price` real,
	`deposit_amount` real,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`is_verified_manually` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_properties_owner_id` ON `properties` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_properties_status` ON `properties` (`status`);--> statement-breakpoint
CREATE INDEX `idx_properties_city_type` ON `properties` (`city`,`property_type`);--> statement-breakpoint
CREATE TABLE `property_media` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`media_type` text DEFAULT 'IMAGE' NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`display_order` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_property_media_property_id` ON `property_media` (`property_id`);--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`intent` text NOT NULL,
	`property_type` text,
	`min_bedrooms` integer,
	`min_bathrooms` real,
	`preferred_cities` text,
	`preferred_locations` text,
	`min_budget` real,
	`max_budget` real,
	`furnishing_status` text,
	`move_in_date` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_verified_manually` integer DEFAULT false NOT NULL,
	`source_record_id` text,
	`extraction_confidence` real,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_requirements_customer_id` ON `requirements` (`customer_id`);--> statement-breakpoint
CREATE TABLE `source_records` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`external_id` text,
	`sender_identifier` text,
	`payload` text NOT NULL,
	`media_url` text,
	`checksum` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_records_type` ON `source_records` (`source_type`);--> statement-breakpoint
CREATE INDEX `idx_source_records_external_id` ON `source_records` (`external_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`lead_id` text,
	`transaction_type` text NOT NULL,
	`amount` real NOT NULL,
	`deposit_paid` real DEFAULT 0,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`contract_url` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_property_id` ON `transactions` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_customer_id` ON `transactions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_owner_id` ON `transactions` (`owner_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'AGENT' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`lead_id` text,
	`scheduled_start` text NOT NULL,
	`scheduled_end` text NOT NULL,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`feedback` text,
	`rating` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_visits_property_id` ON `visits` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_visits_customer_id` ON `visits` (`customer_id`);