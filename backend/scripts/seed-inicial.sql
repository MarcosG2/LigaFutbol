-- DEPRECADO: usar scripts/seed.sql para DDL + datos mínimos.
-- Seed mínimo para desarrollo (liga_futbol)
-- Admin: usuario admin@liga.local / password: admin123
-- Hash SHA-256 de "admin123"

INSERT INTO Torneos (nombre, estado) VALUES ('Liga UNSE 2026', 'Activo');

INSERT INTO Administradores (usuario, password_hash) VALUES (
  'admin@liga.local',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74b720e9'
);

INSERT INTO Equipos (nombre, escudo_url, instagram, estado) VALUES
  ('Tuca FC', NULL, 'Ingeniería', 'Activo'),
  ('Beltran Munich', NULL, 'Humanidades', 'Activo'),
  ('La Rotonda FC', NULL, 'Agronomía', 'Activo');

INSERT INTO Jugadores (equipo_id, nombre, numero_camiseta, goles) VALUES
  (1, 'Jugador Tuca 1', 1, 0),
  (1, 'Jugador Tuca 2', 2, 0),
  (1, 'Jugador Tuca 3', 3, 0),
  (1, 'Jugador Tuca 4', 4, 0),
  (1, 'Jugador Tuca 5', 5, 0),
  (1, 'Jugador Tuca 6', 6, 0),
  (1, 'Jugador Tuca 7', 7, 0),
  (1, 'Jugador Tuca 8', 8, 0),
  (1, 'Jugador Tuca 9', 9, 0),
  (1, 'Jugador Tuca 10', 10, 0),
  (1, 'Jugador Tuca 11', 11, 0),
  (2, 'Jugador Beltran 1', 1, 0),
  (2, 'Jugador Beltran 2', 2, 0),
  (2, 'Jugador Beltran 3', 3, 0),
  (2, 'Jugador Beltran 4', 4, 0),
  (2, 'Jugador Beltran 5', 5, 0),
  (2, 'Jugador Beltran 6', 6, 0),
  (2, 'Jugador Beltran 7', 7, 0),
  (2, 'Jugador Beltran 8', 8, 0),
  (2, 'Jugador Beltran 9', 9, 0),
  (2, 'Jugador Beltran 10', 10, 0),
  (2, 'Jugador Beltran 11', 11, 0);

INSERT INTO Partidos (
  torneo_id, numero_fecha, numero_partido, equipo_local_id, equipo_visitante_id,
  goles_local, goles_visitante, fecha_hora, estado
) VALUES
  (1, 1, 1, 1, 2, NULL, NULL, '2026-05-12 18:00:00', 'Pendiente'),
  (1, 1, 2, 3, 1, 1, 1, '2026-05-12 20:00:00', 'Jugado'),
  (1, 2, 1, 2, 3, NULL, NULL, '2026-05-19 18:00:00', 'Pendiente');
