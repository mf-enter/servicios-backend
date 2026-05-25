INSERT INTO `service_types` (`service_name`, `description`, `created_at`, `updated_at`)
SELECT 'Cerrajero', 'Apertura, reparación y cambio de cerraduras', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Cerrajero')
  LIMIT 1
)
UNION ALL
SELECT 'Limpieza', 'Servicios de limpieza residencial y comercial', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Limpieza')
  LIMIT 1
)
UNION ALL
SELECT 'Pintor', 'Pintura y retoques para interiores y exteriores', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Pintor')
  LIMIT 1
)
UNION ALL
SELECT 'Plomero', 'Instalación, reparación y mantenimiento de tuberías', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Plomero')
  LIMIT 1
)
UNION ALL
SELECT 'Carpintero', 'Fabricación, ajuste y reparación de madera', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Carpintero')
  LIMIT 1
)
UNION ALL
SELECT 'Electricista', 'Instalaciones y reparaciones eléctricas', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM `service_types`
  WHERE LOWER(`service_name`) = LOWER('Electricista')
  LIMIT 1
);