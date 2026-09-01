/**
 * Fonctionnalités avancées — schéma Drizzle (devises, paiements, API, webhooks).
 */
import { pgTable, text, uuid, boolean, numeric, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, isActive } from "./helpers";
import { organizations } from "./core";

export const currencies = pgTable(
  "currencies",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name"),
    rateToKmf: numeric("rate_to_kmf", { precision: 18, scale: 6, mode: "number" }).notNull().default(1),
    isDefault: boolean("is_default").notNull().default(false),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("currencies_org_idx").on(t.organizationId)]
);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payment_methods_org_idx").on(t.organizationId)]
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    keyText: text("key_text").notNull(),
    label: text("label"),
    active: isActive(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("api_keys_org_idx").on(t.organizationId), uniqueIndex("api_keys_text_idx").on(t.keyText)]
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name"),
    secretKey: text("secret_key"),
    method: text("method").notNull().default("POST"), // POST | PUT | PATCH
    event: text("event").notNull(),
    url: text("url").notNull(),
    active: isActive(),
    lastDeliveryAt: timestamp("last_delivery_at"),
    deliveryCount: integer("delivery_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("webhooks_org_idx").on(t.organizationId)]
);

export type Currency = typeof currencies.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
