ALTER TABLE `Partidos`
  MODIFY COLUMN `estado` enum('Pendiente','Jugado','Suspendido','Reprogramado') DEFAULT 'Pendiente';
