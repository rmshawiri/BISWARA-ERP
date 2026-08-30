/**
 * Comptabilité — schéma Drizzle (plan comptable, journaux, écritures, exercices).
 */
import { pgTable, text, uuid, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

const money = (col: string) =>
  numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    label: text("label").notNull(),
    class: text("class"),
    type: text("type"), // asset | liability | equity | revenue | expense
    parentId: uuid("parent_id"),
    active: text("active").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("chart_of_accounts_org_idx").on(t.organizationId)]
);

export const journals = pgTable(
  "journals",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    active: text("active").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("journals_org_idx").on(t.organizationId)]
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    date: text("date"),
    label: text("label").notNull(),
    totalDebit: money("total_debit"),
    totalCredit: money("total_credit"),
    balanced: text("balanced").notNull().default("yes"),
    status: status("draft"),
    sourceModule: text("source_module"),
    userMeta: jsonb("user_meta"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("journal_entries_org_idx").on(t.organizationId)]
);

export const journalEntryLines = pgTable(
  "journal_entry_lines",
  {
    id: id(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    debit: money("debit"),
    credit: money("credit"),
  },
  (t) => [index("journal_entry_lines_entry_idx").on(t.entryId)]
);

export const fiscalYears = pgTable(
  "fiscal_years",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    startDate: text("start_date"),
    endDate: text("end_date"),
    status: status("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("fiscal_years_org_idx").on(t.organizationId)]
);

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type FiscalYear = typeof fiscalYears.$inferSelect;
