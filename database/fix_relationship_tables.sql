-- Script de migración para corregir las relaciones entre tablas
-- Ejecutar estos comandos en tu base de datos 'servicios'

-- 1. Verificar que las columnas city_id existan en postal_codes
-- (ya están presentes según SHOW COLUMNS)

-- 2. Si alguna tabla está dañada, recrearla limpia

-- IMPORTANTE: Ejecuta estos comandos en orden

-- Limpieza de datos inconsistentes (opcional, descomenta si necesitas)
-- DELETE FROM postal_codes WHERE city_id NOT IN (SELECT city_id FROM cities);
-- DELETE FROM cities WHERE state_id NOT IN (SELECT state_id FROM states);
-- DELETE FROM states WHERE country_id NOT IN (SELECT country_id FROM countries);

-- Crear índices
ALTER TABLE `postal_codes` ADD INDEX `idx_city_id` (`city_id`);
ALTER TABLE `cities` ADD INDEX `idx_state_id` (`state_id`);
ALTER TABLE `states` ADD INDEX `idx_country_id` (`country_id`);

-- Verificar estructura final
SELECT 'postal_codes' as tabla, COUNT(*) as registros FROM postal_codes
UNION
SELECT 'cities', COUNT(*) FROM cities
UNION
SELECT 'states', COUNT(*) FROM states
UNION
SELECT 'countries', COUNT(*) FROM countries;
