ALTER TABLE `sessions` ADD `user_agent` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `ip_address` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `last_active` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `github_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `github_avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_avatar` text;