import "server-only";

import { eq, and, like, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  chartOfAccounts,
  journals,
  journalEntries,
  journalEntryLines,
} from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { buildDocumentNumber } from "@/lib/numbering";
import { buildEntry, type EntryLine } from "./logic";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.ACCOUNTING, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

async function nextEntryNumber(
  organizationId: string,
  prefix: string,
  year: number
): Promise<number> {
  const [row] = await db()
    .select({ c: sql<number>`count(*)::int` })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.organizationId, organizationId),
        like(journalEntries.number, `${prefix}-${year}-%`)
      )
    );
  return Number(row?.c ?? 0) + 1;
}

export interface CreateJournalEntryInput {
  journalId: string;
  date: string;
  label: string;
  lines: EntryLine[];
  sourceModule?: string | null;
}

/**
 * Crée une écriture comptable équilibrée (Débit = Crédit).
 * Rejette si l'écriture n'est pas équilibrée (règles métier Comptabilité).
 */
export async function createJournalEntry(
  ctx: AuthzContext,
  input: CreateJournalEntryInput
): Promise<Result<typeof journalEntries.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;

  const built = buildEntry(input.lines);
  if (!built.balanced || built.errors.length > 0) {
    return err(built.errors[0] ?? "Écriture non équilibrée.");
  }

  try {
    const year = new Date().getFullYear();
    const seq = await nextEntryNumber(orgId, "EC", year);
    const number = buildDocumentNumber({ prefix: "EC", year, seq });

    const [entry] = await db()
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        journalId: input.journalId,
        number,
        date: input.date,
        label: input.label,
        totalDebit: built.totalDebit,
        totalCredit: built.totalCredit,
        balanced: "yes",
        status: "validated",
        sourceModule: input.sourceModule ?? null,
      })
      .returning();
    if (!entry) return err("Création impossible.");

    await db()
      .insert(journalEntryLines)
      .values(
        built.lines.map((l) => ({
          entryId: entry.id,
          accountId: l.account, // account = id du compte (uuid)
          label: l.label,
          debit: l.debit,
          credit: l.credit,
        }))
      );

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.ACCOUNTING,
      action: "journal_entry.create",
      entityType: "journal_entry",
      entityId: entry.id,
      newValue: { number, total: built.totalDebit },
    });

    return ok(entry);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listAccounts(
  ctx: AuthzContext
): Promise<Result<typeof chartOfAccounts.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const result = await db()
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.organizationId, orgId));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function listJournals(
  ctx: AuthzContext
): Promise<Result<typeof journals.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const result = await db()
      .select()
      .from(journals)
      .where(eq(journals.organizationId, orgId));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Liste les écritures comptables de l'organisation (ordre décroissant). */
export async function listJournalEntries(
  ctx: AuthzContext
): Promise<Result<typeof journalEntries.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(100);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Grand Livre : lignes d'un compte (ou de tous) avec date/n° de l'écriture. */
export async function getGrandLivre(
  ctx: AuthzContext,
  accountId?: string
): Promise<Result<{ date: string | null; number: string; label: string; debit: number; credit: number }[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select({
        date: journalEntries.date,
        number: journalEntries.number,
        label: journalEntryLines.label,
        debit: journalEntryLines.debit,
        credit: journalEntryLines.credit,
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
      .innerJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
      .where(and(eq(chartOfAccounts.organizationId, orgId), accountId ? eq(journalEntryLines.accountId, accountId) : undefined))
      .orderBy(journalEntries.date);
    return ok(rows.map((r) => ({ date: r.date, number: r.number, label: r.label, debit: Number(r.debit), credit: Number(r.credit) })));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Balance générale : total débit / crédit / solde par compte. */
export async function getBalance(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const accounts = await db().select().from(chartOfAccounts).where(eq(chartOfAccounts.organizationId, orgId));
    const rows = await db()
      .select({ accountId: journalEntryLines.accountId, debit: journalEntryLines.debit, credit: journalEntryLines.credit })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
      .where(eq(journalEntries.organizationId, orgId));
    const sums = new Map<string, { debit: number; credit: number }>();
    for (const r of rows) {
      const s = sums.get(r.accountId) ?? { debit: 0, credit: 0 };
      s.debit += Number(r.debit);
      s.credit += Number(r.credit);
      sums.set(r.accountId, s);
    }
    return ok(
      accounts.map((a) => {
        const s = sums.get(a.id) ?? { debit: 0, credit: 0 };
        return { number: a.number, label: a.label, type: a.type, debit: s.debit, credit: s.credit, balance: s.debit - s.credit };
      })
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** États financiers simplifiés (Résultat + Bilan). */
export async function getFinancialStatements(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select({ type: chartOfAccounts.type, debit: journalEntryLines.debit, credit: journalEntryLines.credit })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
      .innerJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
      .where(eq(chartOfAccounts.organizationId, orgId));
    let revenue = 0, expense = 0, assets = 0, liabilities = 0, equity = 0;
    for (const r of rows) {
      const d = Number(r.debit), c = Number(r.credit);
      if (r.type === "revenue") revenue += c - d;
      else if (r.type === "expense") expense += d - c;
      else if (r.type === "asset") assets += d - c;
      else if (r.type === "liability") liabilities += c - d;
      else if (r.type === "equity") equity += c - d;
    }
    return ok({
      revenue,
      expense,
      net: revenue - expense,
      assets,
      liabilities,
      equity,
      balanceSheetCheck: assets - (liabilities + equity),
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

