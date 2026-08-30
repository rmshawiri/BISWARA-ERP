/**
 * Stock & Inventaire — schéma Drizzle (dépôts, mouvements, inventaires).
 */
import { pgTable, text, uuid, numeric, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";
import { products } from "./catalog";

export const warehouses = pgTable(
  "warehouses",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    managerUserId: uuid("manager_user_id"),
    address: text("address"),
    status: status("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("warehouses_org_idx").on(t.organizationId)]
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(), // in | out | transfer | adjust | inventory
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" })
      .notNull()
      .default(0),
    reference: text("reference"),
    date: text("date"),
    notes: text("notes"),
    userId: uuid("user_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("stock_movements_org_idx").on(t.organizationId),
    index("stock_movements_product_idx").on(t.productId),
  ]
);

export const inventoryCounts = pgTable(
  "inventory_counts",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id").references(() => warehouses.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("full"), // full | partial | cyclical
    status: status("draft"), // draft | in_progress | completed
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("inventory_counts_org_idx").on(t.organizationId)]
);

export type Warehouse = typeof warehouses.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InventoryCount = typeof inventoryCounts.$inferSelect;
