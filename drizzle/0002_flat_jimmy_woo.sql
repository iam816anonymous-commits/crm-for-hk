ALTER TABLE `calls` ADD `device_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `calls_external_call_sid_unique` ON `calls` (`external_call_sid`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_calls_external_sid` ON `calls` (`external_call_sid`);--> statement-breakpoint
CREATE INDEX `idx_calls_from_to` ON `calls` (`from_number`,`to_number`);