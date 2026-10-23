-- Un solo partido destacado por jornada (numero_fecha) dentro del mismo torneo.
ALTER TABLE Partidos
  ADD COLUMN destacado_portada TINYINT(1) NOT NULL DEFAULT 0 AFTER estado;
