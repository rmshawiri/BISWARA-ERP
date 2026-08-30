/**
 * Colonnes communes aux tables BISWARA (cohérence / DRY).
 * Les références vers `organizations` sont définies directement dans chaque
 * table pour éviter les imports circulaires.
 */
import { timestamp, uuid, text, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const id = () => uuid("id").defaultRandom().primaryKey();

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`);

export const status = (def = "active") =>
  text("status").notNull().default(def);

export const isActive = () => boolean("active").notNull().default(true);

export const sortOrder = () => integer("sort_order").notNull().default(0);

export const metadata = () => jsonb("metadata");

export const booleanDefault = (def = false) => boolean().notNull().default(def);

export { uuid, text };
