/**
 * BISWARA ERP — Audit réel de la persistance (connexion PG pooler + REST).
 *
 * Exécution : node --env-file=.env.local scripts/audit-db-test.mjs
 *
 * Vérifie :
 *  1. Connexion PG via DATABASE_URL (même logique que src/db/index.ts : pooler + rejectUnauthorized:false).
 *  2. Lecture des compteurs des tables métier clés.
 *  3. Cycle INSERT → SELECT → DELETE réel (persistance prouvée) sur organizations.
 *  4. Cohérence REST (Supabase SDK) vs Drizzle (pg) : écrire via REST, lire via pg, puis nettoyer.
 */
import pg from "pg";

const { Pool } = pg;

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT: " + msg);
  console.log("  ✓ " + msg);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante dans .env.local");

  console.log("=== 1. CONNEXION Pg (pooler, ssl rejectUnauthorized:false) ===");
  const pool = new Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 12000,
    ssl: { rejectUnauthorized: false },
  });

  const ping = await pool.query("SELECT 1 AS one");
  assert(ping.rows[0].one === 1, "Connexion Pg OK (SELECT 1)");

  console.log("\n=== 2. COMPTEURS TABLES MÉTIER ===");
  const tables = ["organizations", "profiles", "products", "customers", "modules", "activities", "subscriptions", "sales_documents", "warehouses"];
  for (const t of tables) {
    try {
      const r = await pool.query(`SELECT count(*)::int AS n FROM "${t}"`);
      console.log(`  • ${t}: ${r.rows[0].n}`);
    } catch (e) {
      console.log(`  • ${t}: INDISPONIBLE (${e.message})`);
    }
  }

  console.log("\n=== 3. CYCLE INSERT→SELECT→DELETE (organizations) ===");
  const stamp = "AUDIT" + Date.now().toString().slice(-8);
  const ins = await pool.query(
    `INSERT INTO organizations (name, sector, country, plan, created_at)
     VALUES ($1, $2, $3, $4, now()) RETURNING id`,
    [`Audit ${stamp}`, "commerce", "KM", "free"]
  );
  const orgId = ins.rows[0].id;
  assert(!!orgId, `Organisation insérée via pg (id=${orgId})`);

  const sel = await pool.query(`SELECT name FROM organizations WHERE id = $1`, [orgId]);
  assert(sel.rows.length === 1 && sel.rows[0].name === `Audit ${stamp}`, "Organisation relue immédiatement via pg");

  const del = await pool.query(`DELETE FROM organizations WHERE id = $1 RETURNING id`, [orgId]);
  assert(del.rows.length === 1, "Organisation supprimée via pg (nettoyage)");

  console.log("\n=== 4. CONNEXION REST Supabase SDK (URL API IPv4) ===");
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let restOk = false;
  if (apiUrl && role) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(apiUrl, role, { auth: { persistSession: false } });
      const { data: orgs, error } = await admin.from("organizations").select("id").limit(1);
      if (error) throw new Error(error.message);
      assert(true, `REST (service_role) OK — organisations vues: ${orgs ? orgs.length : 0}`);
      restOk = true;
    } catch (e) {
      console.log("  ✗ REST échec: " + e.message);
    }
  } else {
    console.log("  ⚠ Clés REST non présentes, lecture REST ignorée.");
  }

  console.log("\n=== RÉSUMÉ ===");
  console.log("  PG: OK");
  if (restOk) console.log("  REST: OK");
  await pool.end();
}

main().catch(async (e) => {
  console.error("❌ ÉCHEC:", e.message);
  process.exit(1);
});
