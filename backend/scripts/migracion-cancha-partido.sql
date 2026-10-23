USE liga_futbol;

ALTER TABLE `Partidos`
  ADD COLUMN `cancha` varchar(100) NOT NULL DEFAULT 'Cancha 1' AFTER `fecha_hora`;
