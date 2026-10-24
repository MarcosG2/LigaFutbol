-- Número de partido dentro de la jornada (Fecha N, Partido M). Idempotente.

SET @tiene_numero_partido := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Partidos'
    AND COLUMN_NAME = 'numero_partido'
);

SET @sql := IF(
  @tiene_numero_partido = 0,
  'ALTER TABLE `Partidos` ADD COLUMN `numero_partido` INT NULL AFTER `numero_fecha`',
  'SELECT ''La columna Partidos.numero_partido ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE Partidos p
INNER JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY numero_fecha ORDER BY fecha_hora IS NULL, fecha_hora, id) AS orden
  FROM Partidos
) AS ordenados ON ordenados.id = p.id
SET p.numero_partido = ordenados.orden
WHERE p.numero_partido IS NULL;
