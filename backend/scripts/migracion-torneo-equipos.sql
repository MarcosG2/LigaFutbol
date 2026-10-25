-- Inscripción de equipos por torneo (retiros y reemplazos). Idempotente.

CREATE TABLE IF NOT EXISTS `TorneoEquipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `torneo_id` int NOT NULL,
  `equipo_id` int NOT NULL,
  `status` enum('ACTIVE','WITHDRAWN','REPLACED') NOT NULL DEFAULT 'ACTIVE',
  `joined_from_round` int NOT NULL DEFAULT 1,
  `withdrawn_at_round` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_torneo_equipo` (`torneo_id`, `equipo_id`),
  KEY `idx_torneo_equipos_torneo` (`torneo_id`),
  KEY `idx_torneo_equipos_equipo` (`equipo_id`),
  CONSTRAINT `TorneoEquipos_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `Torneos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `TorneoEquipos_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `Equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
