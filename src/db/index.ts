import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

/**
 * Client Base de données (Drizzle + PostgreSQL direct).
 *
 * ⚠️ RÉSERVÉ AU SERVEUR UNIQUEMENT.
 * - Ne jamais l'utiliser dans du code côté client.
 * - L'isolation multi-tenant DOIT être appliquée manuellement dans la
 *   couche service (filtre `organization_id`) en plus de la RLS.
 *
 * Connexion via DATABASE_URL (connexion directe Supabase, SSL requis).
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
