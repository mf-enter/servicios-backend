-- =========================================================================
-- SCRIPT UNIFICADO, COMPLETO E INDEPENDIENTE
-- Base de Datos: servicios_pro
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS `v_services_full`;
DROP TABLE IF EXISTS `service_status_history`, `service_messages`, `service_reviews`, `payments`, `payment_methods`;
DROP TABLE IF EXISTS `services`, `service_statuses`, `service_types`, `admin_logs`, `admins`;
DROP TABLE IF EXISTS `role_permissions`, `permissions`, `user_roles`, `roles`, `worker_profiles`, `user_profiles`;
DROP TABLE IF EXISTS `users`, `user_types`, `addresses`, `postal_codes`, `cities`, `states`, `countries`, `documents`;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- 1. ESTRUCTURA GEOGRÁFICA
-- =========================================================================
CREATE TABLE `countries` (
  `country_id` INT NOT NULL AUTO_INCREMENT,
  `country_name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(10) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`country_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `states` (
  `state_id` INT NOT NULL AUTO_INCREMENT,
  `country_id` INT NOT NULL,
  `state_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`state_id`),
  CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cities` (
  `city_id` INT NOT NULL AUTO_INCREMENT,
  `state_id` INT NOT NULL,
  `city_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`city_id`),
  CONSTRAINT `fk_cities_state` FOREIGN KEY (`state_id`) REFERENCES `states` (`state_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `postal_codes` (
  `postal_code_id` INT NOT NULL AUTO_INCREMENT,
  `city_id` INT NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `settlement_name` VARCHAR(150) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`postal_code_id`),
  CONSTRAINT `fk_postal_codes_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`city_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `addresses` (
  `address_id` INT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) DEFAULT NULL,
  `address_type` VARCHAR(50) DEFAULT NULL,
  `postal_code_id` INT DEFAULT NULL,
  `street_name` VARCHAR(150) DEFAULT NULL,
  `ext_number` VARCHAR(20) DEFAULT NULL,
  `int_number` VARCHAR(20) DEFAULT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  CONSTRAINT `fk_addresses_postal_code` FOREIGN KEY (`postal_code_id`) REFERENCES `postal_codes` (`postal_code_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 2. SEGURIDAD, ROLES Y USUARIOS
-- =========================================================================
CREATE TABLE `user_types` (
  `user_type_id` INT NOT NULL AUTO_INCREMENT,
  `type_name` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `lastname` VARCHAR(100) DEFAULT NULL,
  `birthdate` DATE DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `user_type_id` INT DEFAULT NULL,
  `address_id` INT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_users_user_type` FOREIGN KEY (`user_type_id`) REFERENCES `user_types` (`user_type_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `workers` (
  `worker_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `lastname` VARCHAR(150) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `address_id` INT DEFAULT NULL,
  `is_verified` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`worker_id`),
  CONSTRAINT `fk_workers_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `worker_profiles` (
  `worker_profile_id` INT NOT NULL AUTO_INCREMENT,
  `worker_id` INT NOT NULL UNIQUE,
  `bio` TEXT,
  `hourly_rate` DECIMAL(10,2) DEFAULT NULL,
  `experience_years` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`worker_profile_id`),
  CONSTRAINT `fk_worker_profiles_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 3. SERVICIOS, ESTADOS Y FLUJOS
-- =========================================================================
CREATE TABLE `service_types` (
  `service_type_id` INT NOT NULL AUTO_INCREMENT,
  `service_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `service_statuses` (
  `status_id` INT NOT NULL AUTO_INCREMENT,
  `status_name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `services` (
  `service_id` INT NOT NULL AUTO_INCREMENT,
  `service_type_id` INT DEFAULT NULL,
  `client_id` INT DEFAULT NULL,
  `worker_id` INT DEFAULT NULL,
  `description` TEXT,
  `estimated_price` DECIMAL(10, 2) DEFAULT NULL,
  `address_id` INT DEFAULT NULL,
  `address_snapshot` JSON DEFAULT NULL,
  `status_id` INT DEFAULT NULL,
  `client_rating` INT DEFAULT NULL,
  `worker_rating` INT DEFAULT NULL,
  `requested_at` DATETIME DEFAULT NULL,
  `accepted_at` DATETIME DEFAULT NULL,
  `started_at` DATETIME DEFAULT NULL,
  `finished_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_id`),
  CONSTRAINT `fk_services_type` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`service_type_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_services_status` FOREIGN KEY (`status_id`) REFERENCES `service_statuses` (`status_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 4. TRANSACCIONES Y AUDITORÍA
-- =========================================================================
CREATE TABLE `payment_methods` (
  `payment_method_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_method_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `service_id` INT DEFAULT NULL,
  `payment_method_id` INT DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `pay_date` DATETIME DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT NULL,
  `transaction_reference` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  CONSTRAINT `fk_payments_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`payment_method_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `service_status_history` (
  `history_id` INT NOT NULL AUTO_INCREMENT,
  `service_id` INT NOT NULL,
  `status_id` INT NOT NULL,
  `changed_by_user_id` INT DEFAULT NULL,
  `changed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  PRIMARY KEY (`history_id`),
  CONSTRAINT `fk_history_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`service_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_status` FOREIGN KEY (`status_id`) REFERENCES `service_statuses` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================================================
-- 5. POBLACIÓN DE CATÁLOGOS BASE Y SEMILLAS (Para evitar fallos de FK)
-- =========================================================================
INSERT INTO `user_types` (`user_type_id`, `type_name`) VALUES 
(1, 'admin'), (2, 'cliente'), (3, 'trabajador');

INSERT INTO `service_statuses` (`status_id`, `status_name`, `description`) VALUES 
(1, 'Pendiente', 'Servicio solicitado y aún no atendido'),
(2, 'Aceptado', 'El trabajador aceptó el servicio'),
(3, 'En progreso', 'El trabajador ya está ejecutando el servicio'),
(4, 'Completado', 'El servicio terminó correctamente'),
(5, 'Cancelado', 'El servicio fue cancelado');

INSERT INTO `service_types` (`service_type_id`, `service_name`, `description`) VALUES 
(1, 'Electricista', 'Luz, cableado y ajustes eléctricos');

INSERT INTO `payment_methods` (`payment_method_id`, `name`) VALUES 
(20, 'Tarjeta de Crédito/Débito');

-- Registros semilla mínimos para pruebas de integridad
INSERT INTO `users` (`user_id`, `name`, `lastname`, `email`, `password`, `user_type_id`) VALUES 
(1, 'Admin', 'Principal', 'admin@gmail.com', '$2a$10$A2M9y4YAqOyH/a8HRWp1fuPCC68CFCMI3Mz0M1sTDGjrHSEmbv.Gi', 1),
(4, 'JOSE', 'CALVILLO', 'u1@gmail.com', '$2a$10$JKUMf380x1nElcX93JntKuvFcHEJ57uTQGYtp9ikuN1pVUqTOGT1C', 2);

INSERT INTO `workers` (`worker_id`, `name`, `lastname`, `email`, `password`, `is_verified`) VALUES 
(1, 'miguel', 'figueroa', 'T1@gmail.com', '$2a$10$fNwXyxR13P0zA049yDbiTeNZIh370FCnxIugIRhpOvtaWWiktfF.W', 1);

INSERT INTO `worker_profiles` (`worker_id`, `bio`, `hourly_rate`, `experience_years`) VALUES 
(1, 'Electricista residencial certificado', 300.00, 14);

-- Insertar un servicio de prueba que calce con tu historial antiguo
INSERT INTO `services` (`service_id`, `service_type_id`, `client_id`, `worker_id`, `description`, `status_id`, `requested_at`) VALUES
(6, 1, 4, 1, 'Solicitud para miguel figueroa. cambio de cables', 4, '2026-05-15 12:15:39');

INSERT INTO `payments` (`payment_id`, `service_id`, `payment_method_id`, `amount`, `pay_date`, `status`, `transaction_reference`) VALUES 
(3, 6, 20, 500.00, '2026-05-15 14:44:08', 'Completado', 'WEB-1715790000');

-- =========================================================================
-- 6. VISTA UNIFICADA ACTUALIZADA (v_services_full)
-- =========================================================================
CREATE VIEW `v_services_full` AS 
SELECT 
  `s`.`service_id` AS `service_id`,
  `s`.`service_type_id` AS `service_type_id`,
  `st`.`service_name` AS `service_type_name`,
  `s`.`client_id` AS `client_id`,
  CONCAT(`u`.`name`, ' ', COALESCE(`u`.`lastname`, '')) AS `client_name`,
  `u`.`email` AS `client_email`,
  `u`.`phone_number` AS `client_phone`,
  `s`.`worker_id` AS `worker_id`,
  CONCAT(`w`.`name`, ' ', COALESCE(`w`.`lastname`, '')) AS `worker_name`,
  `w`.`email` AS `worker_email`,
  `wp`.`bio` AS `worker_bio`,
  `wp`.`hourly_rate` AS `hourly_rate`,
  `wp`.`experience_years` AS `experience_years`,
  `s`.`description` AS `description`,
  `s`.`estimated_price` AS `estimated_price`,
  `s`.`requested_at` AS `requested_at`,
  `s`.`accepted_at` AS `accepted_at`,
  `s`.`started_at` AS `started_at`,
  `s`.`finished_at` AS `finished_at`,
  `s`.`status_id` AS `status_id`,
  `ss`.`status_name` AS `status_name`,
  `s`.`address_id` AS `address_id`,
  `s`.`address_snapshot` AS `address_snapshot`,
  `a`.`street_name` AS `street_name`,
  `a`.`ext_number` AS `ext_number`,
  `a`.`int_number` AS `int_number`,
  `pc`.`postal_code` AS `postal_code`,
  `pc`.`settlement_name` AS `settlement_name`,
  `c`.`city_name` AS `city_name`,
  `stt`.`state_name` AS `state_name`,
  `co`.`country_name` AS `country_name`,
  `p`.`payment_id` AS `payment_id`,
  `p`.`payment_method_id` AS `payment_method_id`,
  `p`.`amount` AS `payment_amount`,
  `p`.`status` AS `payment_status`,
  `p`.`transaction_reference` AS `transaction_reference`,
  `p`.`pay_date` AS `pay_date`
FROM `services` `s`
LEFT JOIN `service_types` `st` ON `st`.`service_type_id` = `s`.`service_type_id`
LEFT JOIN `users` `u` ON `u`.`user_id` = `s`.`client_id`
LEFT JOIN `workers` `w` ON `w`.`worker_id` = `s`.`worker_id`
LEFT JOIN `worker_profiles` `wp` ON `wp`.`worker_id` = `w`.`worker_id`
LEFT JOIN `service_statuses` `ss` ON `ss`.`status_id` = `s`.`status_id`
LEFT JOIN `addresses` `a` ON `a`.`address_id` = `s`.`address_id`
LEFT JOIN `postal_codes` `pc` ON `pc`.`postal_code_id` = `a`.`postal_code_id`
LEFT JOIN `cities` `c` ON `c`.`city_id` = `pc`.`city_id`
LEFT JOIN `states` `stt` ON `stt`.`state_id` = `c`.`state_id`
LEFT JOIN `countries` `co` ON `co`.`country_id` = `stt`.`country_id`
LEFT JOIN `payments` `p` ON `p`.`service_id` = `s`.`service_id`;