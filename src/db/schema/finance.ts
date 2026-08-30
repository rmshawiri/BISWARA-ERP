/**
 * Finance & Trésorerie — schéma Drizzle (comptes, caisses, sessions, opérations, budgets).
 */
import { pgTable, text, uuid, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("cash"), // cash | bank | mobile_money
    code: text("code"),
    currency: text("currency").notNull().default("KMF"),
    openingBalance: money("opening_balance"),
    status: status("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_org_idx").on(t.organizationId)]
);

export const cashSessions = pgTable(
  "cash_sessions",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    openedBy: uuid("opened_by"),
    openedAt: text("opened_at"),
    closedAt: text("closed_at"),
    openingBalance: money("opening_balance"),
    theoreticalBalance: money("theoretical_balance"),
    realBalance: money("real_balance"),
    gap: money("gap"),
    justification: text("justification"),
    status: status("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("cash_sessions_org_idx").on(t.organizationId)]
);

export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(), // in | out | transfer
    amount: money("amount"),
    method: text("method").notNull().default("cash"),
    reference: text("reference"),
    date: text("date"),
    notes: text("notes"),
    userMeta: jsonb("user_meta"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("financial_transactions_org_idx").on(t.organizationId)]
);

export const budgets = pgTable(
  "budgets",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    planned: money("planned"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("budgets_org_idx").on(t.organizationId)]
);

export type Account = typeof accounts.$inferSelect;
export type CashSession = typeof cashSessions.$inferSelect;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
