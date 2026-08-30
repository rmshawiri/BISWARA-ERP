/**
 * Catalogue Produits & Services — schéma Drizzle.
 */
import {
  pgTable,
  text,
  uuid,
  numeric,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, isActive, sortOrder } from "./helpers";
import { organizations } from "./core";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const productCategories = pgTable(
  "product_categories",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: sortOrder(),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("product_categories_org_idx").on(t.organizationId)]
);

export const units = pgTable(
  "units",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    symbol: text("symbol"),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("units_org_idx").on(t.organizationId)]
);

export const taxes = pgTable(
  "taxes",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 6, scale: 3, mode: "number" })
      .notNull()
      .default(0),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("taxes_org_idx").on(t.organizationId)]
);

export const brands = pgTable(
  "brands",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    active: isActive(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("brands_org_idx").on(t.organizationId)]
);

export const products = pgTable(
  "products",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    reference: text("reference").notNull(),
    barcode: text("barcode"),
    categoryId: uuid("category_id").references(() => productCategories.id, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    taxId: uuid("tax_id").references(() => taxes.id, { onDelete: "set null" }),
    description: text("description"),
    purchasePrice: money("purchase_price"),
    salePrice: money("sale_price"),
    wholesalePrice: numeric("wholesale_price", {
      precision: 14,
      scale: 2,
      mode: "number",
    }),
    isService: boolean("is_service").notNull().default(false),
    active: isActive(),
    imageUrl: text("image_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_org_idx").on(t.organizationId),
    uniqueIndex("products_org_ref_idx").on(t.organizationId, t.reference),
  ]
);

export type ProductCategory = typeof productCategories.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Tax = typeof taxes.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
