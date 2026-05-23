-- Agrega columnas de timestamps para el ciclo de vida del servicio
-- Ejecutar en la base de datos del proyecto (MySQL 5.7+)

ALTER TABLE services ADD COLUMN requested_at DATETIME NULL;
ALTER TABLE services ADD COLUMN accepted_at DATETIME NULL;
ALTER TABLE services ADD COLUMN started_at DATETIME NULL;
ALTER TABLE services ADD COLUMN finished_at DATETIME NULL;
