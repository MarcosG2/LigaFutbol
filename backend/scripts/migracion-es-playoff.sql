-- Marca partidos de fase eliminatoria (playoffs). Idempotente.

SET @tiene_es_playoff := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Partidos'
    AND COLUMN_NAME = 'es_playoff'
);

SET @sql := IF(
  @tiene_es_playoff = 0,
  'ALTER TABLE `Partidos` ADD COLUMN `es_playoff` TINYINT(1) NOT NULL DEFAULT 0 AFTER `destacado_portada`',
  'SELECT ''La columna Partidos.es_playoff ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
