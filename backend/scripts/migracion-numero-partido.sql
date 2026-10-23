-- Número de partido dentro de la jornada (Fecha N, Partido M)
ALTER TABLE Partidos
  ADD COLUMN numero_partido INT NULL AFTER numero_fecha;

UPDATE Partidos p
INNER JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY numero_fecha ORDER BY fecha_hora IS NULL, fecha_hora, id) AS orden
  FROM Partidos
) AS ordenados ON ordenados.id = p.id
SET p.numero_partido = ordenados.orden;
