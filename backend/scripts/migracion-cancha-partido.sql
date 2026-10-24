-- Ejecutar conectado a la base de producción (Aiven: elegir el schema correcto en el cliente SQL).
-- Idempotente: no falla si la columna ya existe.

SET @tiene_cancha := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Partidos'
    AND COLUMN_NAME = 'cancha'
);

SET @sql := IF(
  @tiene_cancha = 0,
  'ALTER TABLE `Partidos` ADD COLUMN `cancha` varchar(100) NOT NULL DEFAULT ''Cancha 1'' AFTER `fecha_hora`',
  'SELECT ''La columna Partidos.cancha ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
