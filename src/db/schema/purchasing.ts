/**
 * Achats & Fournisseurs — schéma Drizzle (fournisseurs, demandes, bons, réceptions, factures).
 */
import { pgTable, text, uuid, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const suppliers = pgTable(
  "suppliers",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    reference: text("reference"),
    contact: text("contact"),
    phone: text("phone"),
    email: text("email"),
    city: text("city"),
    paymentTerms: text("payment_terms"),
    status: status("active"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("suppliers_org_idx").on(t.organizationId)]
);

export const purchaseDocuments = pgTable(
  "purchase_documents",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // request | requisition | order | receipt | supplier_invoice
    number: text("number").notNull(),
    date: text("date"),
    status: status("draft"), // draft | pending | validated | rejected | received | paid
    total: money("total"),
    userMeta: jsonb("user_meta"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("purchase_documents_org_idx").on(t.organizationId),
    index("purchase_documents_org_type_idx").on(t.organizationId, t.type),
  ]
);

export const purchaseDocumentLines = pgTable(
  "purchase_document_lines",
  {
    id: id(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => purchaseDocuments.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" })
      .notNull()
      .default(1),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    lineTotal: money("line_total"),
  },
  (t) => [index("purchase_lines_doc_idx").on(t.documentId)]
);

export const purchaseValidations = pgTable(
  "purchase_validations",
  {
    id: id(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => purchaseDocuments.id, { onDelete: "cascade" }),
    step: text("step").notNull(),
    role: text("role").notNull(),
    validatorId: uuid("validator_id"),
    decision: text("decision"), // approved | rejected | comment
    comment: text("comment"),
    createdAt: createdAt(),
  },
  (t) => [index("purchase_validations_doc_idx").on(t.documentId)]
);

export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseDocument = typeof purchaseDocuments.$inferSelect;
export type PurchaseDocumentLine = typeof purchaseDocumentLines.$inferSelect;
export type PurchaseValidation = typeof purchaseValidations.$inferSelect;
