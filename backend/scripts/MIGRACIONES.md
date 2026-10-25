# Migraciones de base de datos

## ¿Se pierden los datos?

**No.** Las migraciones de este proyecto solo **agregan** columnas o tablas (`ALTER TABLE … ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`).  
Los equipos, jugadores, partidos y resultados que ya tenés **siguen igual**. Las filas viejas reciben el valor por defecto de la columna nueva (por ejemplo `cancha = 'Cancha 1'`).

## Cómo ejecutar

Desde `backend/`:

```bash
pnpm migrate          # desarrollo (tsx)
pnpm build && pnpm migrate:prod   # producción compilada
```

En el hosting (recomendado para Aiven), definí:

```env
RUN_MIGRATIONS_ON_START=true
```

Así, cada vez que arranca el backend, aplica solo las migraciones **pendientes** y registra cuáles ya corrió en la tabla `schema_migraciones`.

## Agregar una migración nueva

1. Creá `scripts/migracion-descripcion.sql` (idempotente si es posible).
2. Añadí el nombre al array `ORDEN_MIGRACIONES` en `src/db/migraciones.ts`.
3. Actualizá `scripts/seed.sql` para instalaciones desde cero.

## Orden actual

1. `migracion-numero-partido.sql`
2. `migracion-destacado-portada.sql`
3. `migracion-sanciones.sql`
4. `migracion-cancha-partido.sql`
5. `migracion-estado-reprogramado.sql`
6. `migracion-es-playoff.sql`

## Base que ya tenía cambios manuales

Si en Aiven ya aplicaste `cancha` a mano, la primera ejecución del runner puede registrar migraciones anteriores y luego `cancha` (no-op). Si algo falla porque el cambio ya existía pero no estaba registrado, ejecutá solo el `.sql` faltante y luego insertá en `schema_migraciones` el nombre del archivo para no repetirlo.
