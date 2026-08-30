/**
 * Gestion Commerciale — schéma Drizzle (devis, commandes, factures, paiements).
 */
import { pgTable, text, uuid, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";
import { customers } from "./crm";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const salesDocuments = pgTable(
  "sales_documents",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(), // quote | order | delivery | invoice | credit_note
    number: text("number").notNull(),
    date: text("date"),
    validUntil: text("valid_until"),
    status: status("draft"), // draft | sent | accepted | validated | cancelled | paid
    subtotal: money("subtotal"),
    taxTotal: money("tax_total"),
    discount: money("discount"),
    total: money("total"),
    dueDate: text("due_date"),
    notes: text("notes"),
    userMeta: jsonb("user_meta"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("sales_documents_org_idx").on(t.organizationId),
    index("sales_documents_org_type_idx").on(t.organizationId, t.type),
  ]
);

export const salesDocumentLines = pgTable(
  "sales_document_lines",
  {
    id: id(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => salesDocuments.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" })
      .notNull()
      .default(1),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3, mode: "number" })
      .notNull()
      .default(0),
    lineTotal: money("line_total"),
    sortOrder: numeric("sort_order", { precision: 6, scale: 0, mode: "number" })
      .notNull()
      .default(0),
  },
  (t) => [index("sales_lines_doc_idx").on(t.documentId)]
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").references(() => salesDocuments.id, {
      onDelete: "set null",
    }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    amount: money("amount"),
    method: text("method").notNull().default("cash"), // cash | mvola | holo | wakati | bank | check | card
    reference: text("reference"),
    date: text("date"),
    status: status("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_org_idx").on(t.organizationId)]
);

export type SalesDocument = typeof salesDocuments.$inferSelect;
export type SalesDocumentLine = typeof salesDocumentLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
