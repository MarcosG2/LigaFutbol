import { ejecutarMigracionesPendientes } from "./db/migraciones.js";

async function main() {
  const { aplicadas, omitidas } = await ejecutarMigracionesPendientes();

  if (aplicadas.length === 0) {
    console.log("[migrate] Nada pendiente. Esquema al día.");
  } else {
    console.log(`[migrate] Aplicadas: ${aplicadas.join(", ")}`);
  }

  if (omitidas.length > 0) {
    console.log(`[migrate] Ya registradas: ${omitidas.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("[migrate] Error:", error);
  process.exit(1);
});
