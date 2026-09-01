/**
 * BISWARA ERP — Application des migrations SQL (connexion directe).
 *
 * Exécution :
 *   node --env-file=.env.local supabase/scripts/apply-migrations.mjs
 *
 * Applique tous les fichiers .sql de supabase/migrations dans l'ordre.
 * Utilise la DATABASE_URL (connexion directe PostgreSQL).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante.");

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// ⚠️ SSL : le certificat Supabase n'est pas signé par une CA publique, on
// désactive la vérification (rejectUnauthorized:false). Le chiffrement TLS reste actif.
// Ne PAS mettre `sslmode=require` dans l'URL : avec pg >= 8.16 il est traité
// comme verify-full et entre en conflit avec l'objet `ssl` explicite.
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  for (const file of files) {
    const path = join(migrationsDir, file);
    const sql = readFileSync(path, "utf-8");
    console.log(`▶ Application de ${file}...`);
    await client.query(sql);
    console.log(`✅ ${file} appliqué.`);
  }
  console.log("\n🎉 Migrations appliquées avec succès.");
} finally {
  await client.end();
}
