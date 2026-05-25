-- =========================================================================
-- INYECCIÓN ADICIONAL: HISTORIAL COMPLETO DE PRUEBAS (OPCIONAL)
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;


-- Asegurar que existan los clientes mínimos mapeados en tus logs antiguos
INSERT INTO `users` (`user_id`, `name`, `lastname`, `email`, `password`, `user_type_id`) 
VALUES (2, 'Usuario', 'Prueba 2', 'u2@gmail.com', 'dummy_pass', 2)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Historial detallado de estados por los que pasaron los servicios
INSERT INTO `service_status_history` (`history_id`, `service_id`, `status_id`, `changed_by_user_id`, `changed_at`, `notes`) VALUES 
(1,1,2,1,'2026-05-14 17:44:19','Servicio solicitado y trabajador asignado'),
(2,2,2,1,'2026-05-14 18:06:19','Servicio solicitado y trabajador asignado'),
(3,2,2,1,'2026-05-14 18:10:29','Trabajador asignado'),
(4,1,2,1,'2026-05-14 18:10:31','Trabajador asignado'),
(5,1,2,1,'2026-05-14 18:10:35','Trabajador asignado'),
(6,3,2,1,'2026-05-14 18:14:28','Servicio solicitado y trabajador asignado'),
(7,4,2,2,'2026-05-14 21:32:10','Servicio solicitado y trabajador asignado'),
(8,5,2,1,'2026-05-15 12:04:22','Servicio solicitado y trabajador asignado'),
(9,6,2,4,'2026-05-15 12:15:39','Servicio solicitado y trabajador asignado'),
(10,7,2,4,'2026-05-15 13:00:57','Servicio solicitado y trabajador asignado'),
(11,8,2,4,'2026-05-15 13:06:45','Servicio solicitado y trabajador asignado'),
(12,9,2,4,'2026-05-15 13:38:28','Servicio solicitado y trabajador asignado'),
(13,10,2,4,'2026-05-15 14:21:12','Servicio solicitado y trabajador asignado'),
(14,10,4,1,'2026-05-15 14:54:17','Estado actualizado a Completado'),
(15,9,5,1,'2026-05-15 14:54:20','Servicio cancelado'),
(16,11,1,4,'2026-05-15 15:12:50','Servicio solicitado con trabajador asignado'),
(17,11,5,4,'2026-05-15 15:39:16','Servicio cancelado'),
(18,12,1,4,'2026-05-15 16:01:37','Servicio solicitado con trabajador asignado'),
(19,12,5,4,'2026-05-15 16:01:48','Servicio cancelado'),
(20,8,5,1,'2026-05-15 16:03:55','Servicio cancelado'),
(21,7,3,1,'2026-05-15 16:21:26','Estado actualizado a En progreso'),
(22,7,4,1,'2026-05-15 16:21:26','Estado actualizado a Completado'),
(23,6,3,1,'2026-05-15 16:22:47','Estado actualizado a En progreso'),
(24,6,4,1,'2026-05-15 16:22:47','Estado actualizado a Completado'),
(25,5,3,1,'2026-05-15 16:22:49','Estado actualizado a En progreso'),
(26,5,4,1,'2026-05-15 16:22:49','Estado actualizado a Completado'),
(27,4,3,1,'2026-05-15 16:22:50','Estado actualizado a En progreso'),
(28,4,4,1,'2026-05-15 16:22:50','Estado actualizado a Completado'),
(29,3,3,1,'2026-05-15 16:22:51','Estado actualizado a En progreso'),
(30,3,4,1,'2026-05-15 16:22:51','Estado actualizado a Completado'),
(31,2,3,1,'2026-05-15 16:22:51','Estado actualizado a En progreso'),
(32,2,4,1,'2026-05-15 16:22:51','Estado actualizado a Completado'),
(33,1,3,1,'2026-05-15 16:22:52','Estado actualizado a En progreso'),
(34,1,4,1,'2026-05-15 16:22:52','Estado actualizado a Completado'),
(35,13,1,4,'2026-05-15 16:25:59','Servicio solicitado con trabajador asignado'),
(36,13,3,1,'2026-05-15 16:36:02','Estado actualizado a En progreso'),
(37,13,4,1,'2026-05-15 16:36:06','Estado actualizado a Completado');

-- Reconstrucción de la tabla opcional admins y sus logs correspondientes
CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `lastname` varchar(150) DEFAULT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admins` (`admin_id`, `name`, `lastname`, `email`, `password`) 
VALUES (1, 'Admin', 'Principal', 'admin@gmail.com', '$2a$10$A2M9y4YAqOyH/a8HRWp1fuPCC68CFCMI3Mz0M1sTDGjrHSEmbv.Gi')
ON DUPLICATE KEY UPDATE `name`=`name`;

CREATE TABLE IF NOT EXISTS `admin_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `changes` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admin_logs` VALUES 
(1,NULL,'service_requested','services',1,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. poner un foco\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-14 17:44:19'),
(2,NULL,'service_requested','services',2,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa.\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-14 18:06:19'),
(3,1,'worker_assigned','services',2,'{\"worker_id\":\"1\"}','::1','Mozilla/5.0','2026-05-14 18:10:29'),
(4,1,'worker_assigned','services',1,'{\"worker_id\":\"1\"}','::1','Mozilla/5.0','2026-05-14 18:10:31'),
(5,1,'worker_assigned','services',1,'{\"worker_id\":\"1\"}','::1','Mozilla/5.0','2026-05-14 18:10:35'),
(6,NULL,'service_requested','services',3,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. yy\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-14 18:14:28'),
(7,NULL,'service_requested','services',4,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. poner un foco\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-14 21:32:10'),
(8,NULL,'service_requested','services',5,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. f\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 12:04:22'),
(9,NULL,'service_requested','services',6,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. cambio de cables\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 12:15:39'),
(10,NULL,'service_requested','services',7,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. cambio\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 13:00:57'),
(11,NULL,'service_requested','services',8,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. g\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 13:06:45'),
(12,NULL,'service_requested','services',9,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. 123\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 13:38:29'),
(13,NULL,'service_requested','services',10,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. cambio\",\"worker_id\":1}','::1','Mozilla/5.0','2026-05-15 14:21:12'),
(14,NULL,'service_requested','services',11,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. 133\",\"worker_id\":1,\"address_id\":null}','::1','Mozilla/5.0','2026-05-15 15:12:50'),
(15,NULL,'service_requested','services',12,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. cambios\",\"worker_id\":1,\"address_id\":null}','::1','Mozilla/5.0','2026-05-15 16:01:37'),
(16,NULL,'service_requested','services',13,'{\"service_type_id\":1,\"description\":\"Solicitud para miguel figueroa. ccccccc\",\"worker_id\":1,\"address_id\":null}','::1','Mozilla/5.0','2026-05-15 16:25:59');

SET FOREIGN_KEY_CHECKS = 1;
