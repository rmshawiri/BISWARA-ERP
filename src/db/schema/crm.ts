/**
 * CRM — schéma Drizzle (prospects, clients, partenaires, opportunités, pipeline).
 */
import { pgTable, text, uuid, numeric, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

export const customers = pgTable(
  "customers",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("customer"), // customer | prospect | partner
    company: text("company"),
    firstname: text("firstname"),
    lastname: text("lastname").notNull(),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    city: text("city"),
    country: text("country").notNull().default("KM"),
    sector: text("sector"),
    source: text("source"),
    ownerUserId: uuid("owner_user_id"),
    status: status("active"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("customers_org_idx").on(t.organizationId),
    index("customers_org_type_idx").on(t.organizationId, t.type),
  ]
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    value: numeric("value", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    probability: numeric("probability", { precision: 5, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    stage: text("stage").notNull().default("prospect"),
    expectedDate: text("expected_date"),
    ownerUserId: uuid("owner_user_id"),
    status: status("open"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("opportunities_org_idx").on(t.organizationId)]
);

export type Customer = typeof customers.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
