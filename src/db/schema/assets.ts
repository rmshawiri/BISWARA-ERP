/**
 * Immobilisations & Gestion des Actifs — schéma Drizzle.
 */
import { pgTable, text, uuid, numeric, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const assets = pgTable(
  "assets",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("equipment"), // equipment | vehicle | building | furniture | computer | other
    reference: text("reference"),
    acquisitionDate: text("acquisition_date"),
    cost: money("cost"),
    residualValue: money("residual_value"),
    usefulLife: numeric("useful_life", { precision: 6, scale: 1, mode: "number" })
      .notNull()
      .default(5),
    method: text("method").notNull().default("linear"), // linear | declining | custom
    location: text("location"),
    notes: text("notes"),
    status: status("active"), // active | disposed | in_maintenance
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("assets_org_idx").on(t.organizationId)]
);

export type Asset = typeof assets.$inferSelect;
