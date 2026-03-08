ALTER TABLE `users` ADD `created_at` integer;--> statement-breakpoint

-- Backfill the creator account from the earliest known session timestamp when possible
UPDATE `users`
SET `created_at` = (
	SELECT MIN(`sessions`.`created_at`)
	FROM `sessions`
	WHERE `sessions`.`user_id` = `users`.`id`
)
WHERE `created_at` IS NULL
  AND (
	lower(COALESCE(`users`.`username`, '')) IN ('ichimarugin', 'ichimarugin728', 'gin ichimaru')
	OR lower(COALESCE(`users`.`github_username`, '')) IN ('ichimarugin', 'ichimarugin728', 'gin ichimaru')
	OR lower(COALESCE(`users`.`google_username`, '')) IN ('ichimarugin', 'ichimarugin728', 'gin ichimaru')
	OR lower(COALESCE(`users`.`discord_username`, '')) IN ('ichimarugin', 'ichimarugin728', 'gin ichimaru')
  );--> statement-breakpoint

-- Backfill all other historical users to Jan 31, 2026 (Asia/Singapore midnight)
UPDATE `users`
SET `created_at` = 1769788800000
WHERE `created_at` IS NULL;
