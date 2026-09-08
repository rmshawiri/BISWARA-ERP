/**
 * Colonnes communes aux tables BISWARA (cohérence / DRY).
 * Les références vers `organizations` sont définies directement dans chaque
 * table pour éviter les imports circulaires.
 */
import { timestamp, uuid, text, boolean, jsonb, integer } from "drizzle-orm/pg-core";

export const id = () => uuid("id").defaultRandom().primaryKey();

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    // ⚠️ Ne PAS utiliser `$onUpdate(() => sql`now()`)` : drizzle-orm 0.41.0
    // appelle `mapToDriverValue` sur le résultat AVANT de tester s'il s'agit
    // d'un fragment SQL → une valeur SQL casse `value.toISOString()`
    // ("value.toISOString is not a function") et fait échouer TOUS les
    // `.update()` de l'application. On retourne un `Date` JS (sérialisé en
    // ISO par le driver). L'horodatage d'update est alors celui du serveur
    // applicatif, ce qui est correct pour un champ `updated_at`.
    .$onUpdate(() => new Date());

export const status = (def = "active") =>
  text("status").notNull().default(def);

export const isActive = () => boolean("active").notNull().default(true);

export const sortOrder = () => integer("sort_order").notNull().default(0);

export const metadata = () => jsonb("metadata");

export const booleanDefault = (def = false) => boolean().notNull().default(def);

export { uuid, text };
