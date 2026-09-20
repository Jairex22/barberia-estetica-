import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { runMigrations } from "./migrate.js";
import { env } from "./env.js";
import { demoContent } from "./demoContent.js";
import { initContentIfMissing } from "./lib/content.js";

async function main() {
  runMigrations();
  initContentIfMissing(demoContent);

  const existingAdminCount = (
    db.prepare("SELECT COUNT(*) as c FROM admins").get() as { c: number }
  ).c;

  if (existingAdminCount === 0) {
    if (!env.adminBootstrapEmail || !env.adminBootstrapPassword) {
      console.warn(
        "ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD no configurados: no se creo administrador inicial.\n" +
          "Configura el archivo .env y vuelve a ejecutar 'npm run seed' para crear el primer administrador."
      );
    } else if (env.adminBootstrapPassword.length < 10) {
      console.warn(
        "ADMIN_BOOTSTRAP_PASSWORD debe tener al menos 10 caracteres. No se creo el administrador."
      );
    } else {
      const hash = await bcrypt.hash(env.adminBootstrapPassword, 12);
      db.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)").run(
        env.adminBootstrapEmail.toLowerCase().trim(),
        hash
      );
      console.log(`Administrador inicial creado: ${env.adminBootstrapEmail}`);
    }
  } else {
    console.log("Ya existe al menos un administrador; no se crea uno nuevo.");
  }

  console.log("Datos de demostración (NOVA Detailing) listos.");
}

main().then(() => process.exit(0));
