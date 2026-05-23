-- Agregar columna estimated_price a la tabla services si no existe
ALTER TABLE `services`
  ADD COLUMN `estimated_price` DECIMAL(10, 2) NULL AFTER `description`;
