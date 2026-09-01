import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

/**
 * Client Base de données (Drizzle + PostgreSQL).
 *
 * ⚠️ RÉSERVÉ AU SERVEUR UNIQUEMENT.
 * - Ne jamais l'utiliser dans du code côté client.
 * - L'isolation multi-tenant DOIT être appliquée manuellement dans la
 *   couche service (filtre `organization_id`) en plus de la RLS.
 *
 * Connexion via DATABASE_URL (pooler Supabase, SSL requis).
 * - Le certificat Supabase n'est pas signé par une CA publique, donc on
 *   désactive la vérification du certificat (`rejectUnauthorized: false`).
 *   ⚠️ À durcir avant la mise en production (attacher la CA Supabase ou
 *   utiliser un tunnel privé). Le chiffrement TLS reste actif.
 * - Ne pas mettre `sslmode=require` dans l'URL : avec pg >= 8.16, il est
 *   traité comme `verify-full` et entre en conflit avec l'objet `ssl` stocké.
 */
declare global {
  var __biswaraDb: ReturnType<typeof createDb> | undefined;
}

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquante");
  }
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  return { pool, client: drizzle(pool) };
}

// Réutilise le pool entre les reloads du dev server.
export function getDb() {
  if (!globalThis.__biswaraDb) {
    globalThis.__biswaraDb = createDb();
  }
  return globalThis.__biswaraDb;
}

export const db = () => getDb().client;
export const pool = () => getDb().pool;
