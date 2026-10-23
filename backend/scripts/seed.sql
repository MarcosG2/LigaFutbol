-- PLU: esquema + datos mínimos (idempotente en admin y torneo activo)
CREATE DATABASE IF NOT EXISTS liga_futbol
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE liga_futbol;

CREATE TABLE IF NOT EXISTS `Administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Torneos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `estado` enum('Activo','Finalizado') DEFAULT 'Activo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `escudo_url` varchar(255) DEFAULT NULL,
  `instagram` varchar(100) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Jugadores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `numero_camiseta` int DEFAULT NULL,
  `goles` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `Jugadores_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `Equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Partidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `torneo_id` int NOT NULL,
  `numero_fecha` int DEFAULT NULL,
  `numero_partido` int DEFAULT NULL,
  `equipo_local_id` int NOT NULL,
  `equipo_visitante_id` int NOT NULL,
  `goles_local` int DEFAULT '0',
  `goles_visitante` int DEFAULT '0',
  `fecha_hora` datetime DEFAULT NULL,
  `estado` enum('Pendiente','Jugado','Suspendido') DEFAULT 'Pendiente',
  `destacado_portada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `torneo_id` (`torneo_id`),
  KEY `equipo_local_id` (`equipo_local_id`),
  KEY `equipo_visitante_id` (`equipo_visitante_id`),
  CONSTRAINT `Partidos_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `Torneos` (`id`),
  CONSTRAINT `Partidos_ibfk_2` FOREIGN KEY (`equipo_local_id`) REFERENCES `Equipos` (`id`),
  CONSTRAINT `Partidos_ibfk_3` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `Equipos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- Admin: admin@liga.local / admin123 (SHA-256)
INSERT INTO Administradores (usuario, password_hash)
VALUES (
  'admin@liga.local',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74b720e9'
)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO Torneos (nombre, estado)
SELECT 'Liga UNSE 2026', 'Activo'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Torneos WHERE estado = 'Activo' LIMIT 1);

-- Datos demo opcionales: ver scripts/seed-inicial.sql
