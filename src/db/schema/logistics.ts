/**
 * Logistique & Transport — schéma Drizzle (véhicules, livraisons).
 */
import { pgTable, text, uuid, numeric, index } from "drizzle-orm/pg-core";
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

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const drivers = pgTable(
  "drivers",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    license: text("license"),
    status: status("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("drivers_org_idx").on(t.organizationId)]
);

export const routes = pgTable(
  "routes",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    routeDate: text("route_date"),
    origin: text("origin"),
    destination: text("destination"),
    status: status("planned"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("routes_org_idx").on(t.organizationId)]
);

export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    fuelDate: text("fuel_date"),
    liters: money("liters"),
    cost: money("cost"),
    odometer: numeric("odometer", { precision: 14, scale: 2, mode: "number" }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("fuel_logs_org_idx").on(t.organizationId)]
);

export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    maintenanceDate: text("maintenance_date"),
    type: text("type"),
    cost: money("cost"),
    description: text("description"),
    status: status("planned"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("maintenance_logs_org_idx").on(t.organizationId)]
);

export const incidents = pgTable(
  "incidents",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    incidentDate: text("incident_date"),
    type: text("type"),
    description: text("description"),
    status: status("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("incidents_org_idx").on(t.organizationId)]
);

export type Driver = typeof drivers.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type FuelLog = typeof fuelLogs.$inferSelect;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
