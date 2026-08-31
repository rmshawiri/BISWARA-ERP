/**
 * Logistique & Transport — schéma Drizzle (véhicules, livraisons).
 */
import { pgTable, text, uuid, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

export const vehicles = pgTable(
  "vehicles",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plate: text("plate").notNull(),
    model: text("model"),
    capacity: text("capacity"),
    status: status("active"), // active | maintenance | out_of_service
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("vehicles_org_idx").on(t.organizationId)]
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
      onDelete: "set null",
    }),
    reference: text("reference"),
    customerName: text("customer_name"),
    origin: text("origin"),
    destination: text("destination"),
    scheduledDate: text("scheduled_date"),
    status: status("pending"), // pending | in_transit | delivered | cancelled
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("deliveries_org_idx").on(t.organizationId)]
);

export type Vehicle = typeof vehicles.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
