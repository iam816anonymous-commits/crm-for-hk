ALTER TABLE `properties` ADD `maintenance_amount` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `properties` ADD `available_from` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `photos` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `requirements` ADD `occupancy_type` text;--> statement-breakpoint
ALTER TABLE `requirements` ADD `special_requirements` text;