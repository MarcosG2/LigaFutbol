-- Sanciones disciplinarias: descuento de puntos por torneo/equipo (no borra datos existentes).

CREATE TABLE IF NOT EXISTS `Sanciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `torneo_id` int NOT NULL,
  `equipo_id` int NOT NULL,
  `puntos` int NOT NULL,
  `motivo` varchar(500) NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sanciones_torneo` (`torneo_id`),
  KEY `idx_sanciones_equipo` (`equipo_id`),
  CONSTRAINT `Sanciones_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `Torneos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `Sanciones_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `Equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
