-- Un solo partido destacado por jornada (numero_fecha) dentro del mismo torneo. Idempotente.

SET @tiene_destacado := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Partidos'
    AND COLUMN_NAME = 'destacado_portada'
);

SET @sql := IF(
  @tiene_destacado = 0,
  'ALTER TABLE `Partidos` ADD COLUMN `destacado_portada` TINYINT(1) NOT NULL DEFAULT 0 AFTER `estado`',
  'SELECT ''La columna Partidos.destacado_portada ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
