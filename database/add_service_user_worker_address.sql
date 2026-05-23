ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `address_id` INT NULL AFTER `user_type_id`;

ALTER TABLE `workers`
  ADD COLUMN IF NOT EXISTS `address_id` INT NULL AFTER `experience_years`;

ALTER TABLE `services`
  ADD COLUMN IF NOT EXISTS `address_id` INT NULL AFTER `worker_id`,
  ADD COLUMN IF NOT EXISTS `address_snapshot` JSON NULL AFTER `address_id`,
  ADD COLUMN IF NOT EXISTS `requested_at` DATETIME NULL AFTER `description`,
  ADD COLUMN IF NOT EXISTS `accepted_at` DATETIME NULL AFTER `requested_at`,
  ADD COLUMN IF NOT EXISTS `started_at` DATETIME NULL AFTER `accepted_at`,
  ADD COLUMN IF NOT EXISTS `finished_at` DATETIME NULL AFTER `started_at`;

-- Optional FK constraints for profile default addresses.
-- Apply these only if your DB design requires hard referential integrity.
SET @has_fk_users := (
  SELECT COUNT(*)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND constraint_name = 'fk_users_address_id'
);
SET @sql_users_fk := IF(
  @has_fk_users = 0,
  'ALTER TABLE `users` ADD CONSTRAINT `fk_users_address_id` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`address_id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_users_fk FROM @sql_users_fk;
EXECUTE stmt_users_fk;
DEALLOCATE PREPARE stmt_users_fk;

SET @has_fk_workers := (
  SELECT COUNT(*)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND constraint_name = 'fk_workers_address_id'
);
SET @sql_workers_fk := IF(
  @has_fk_workers = 0,
  'ALTER TABLE `workers` ADD CONSTRAINT `fk_workers_address_id` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`address_id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_workers_fk FROM @sql_workers_fk;
EXECUTE stmt_workers_fk;
DEALLOCATE PREPARE stmt_workers_fk;
