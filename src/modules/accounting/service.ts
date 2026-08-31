import "server-only";

import { eq, and, like, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  chartOfAccounts,
  journals,
  journalEntries,
  journalEntryLines,
  fiscalYears,
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

/* ---- Exercices comptables (clôture) ---- */
export async function listFiscalYears(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db().select().from(fiscalYears).where(eq(fiscalYears.organizationId, orgId)).orderBy(fiscalYears.startDate);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createFiscalYear(ctx: AuthzContext, startDate: string, endDate: string) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(fiscalYears).values({ organizationId: orgId, startDate, endDate, status: "open" }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function setFiscalYearStatus(ctx: AuthzContext, id: string, status: string) {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().update(fiscalYears).set({ status }).where(and(eq(fiscalYears.id, id), eq(fiscalYears.organizationId, orgId))).returning();
    if (!row) return err("Exercice introuvable.");
    await logAudit({ userId: ctx.user.id, userName: ctx.user.fullName, organizationId: orgId, module: "accounting", action: `fiscal_year.${status}`, entityType: "fiscal_year", entityId: id });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Contre-passation : crée une écriture inverse d'une écriture existante. */
export async function createReversingEntry(ctx: AuthzContext, entryId: string) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [entry] = await db().select().from(journalEntries).where(and(eq(journalEntries.id, entryId), eq(journalEntries.organizationId, orgId))).limit(1);
    if (!entry) return err("Écriture introuvable.");
    const lines = await db().select().from(journalEntryLines).where(eq(journalEntryLines.entryId, entryId));
    const reversed = lines.map((l) => ({ account: l.accountId, label: `Contre-passation — ${l.label}`, debit: l.credit, credit: l.debit }));
    const result = await createJournalEntry(ctx, {
      journalId: entry.journalId,
      date: new Date().toISOString().slice(0, 10),
      label: `Contre-passation ${entry.number}`,
      lines: reversed,
      sourceModule: "accounting",
    });
    if (result.ok) {
      await logAudit({ userId: ctx.user.id, userName: ctx.user.fullName, organizationId: orgId, module: "accounting", action: "journal_entry.reverse", entityType: "journal_entry", entityId: entryId });
    }
    return result;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de contre-passation");
  }
}

/* ---- Helpers de génération automatique ---- */
async function defaultJournal(ctx: AuthzContext, orgId: string) {
  const rows = await db().select().from(journals).where(eq(journals.organizationId, orgId)).limit(1);
  return rows[0] ?? null;
}
async function pickAccount(ctx: AuthzContext, orgId: string, type: string) {
  const rows = await db()
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.type, type)))
    .limit(1);
  return rows[0] ?? null;
}

/** Écriture automatique : ventes (débit actif, crédit produit). */
export async function autoPostSalesEntry(ctx: AuthzContext, amount: number, label: string) {
  const orgId = ctx.organization!.id;
  const journal = await defaultJournal(ctx, orgId);
  const asset = await pickAccount(ctx, orgId, "asset");
  const revenue = await pickAccount(ctx, orgId, "revenue");
  if (!journal || !asset || !revenue) return err("Comptabilité non configurée (journal + comptes actif/produit).");
  try {
    const res = await createJournalEntry(ctx, {
      journalId: journal.id,
      date: new Date().toISOString().slice(0, 10),
      label,
      lines: [
        { account: asset.id, label: "Encaissement client", debit: amount, credit: 0 },
        { account: revenue.id, label: "Ventes", debit: 0, credit: amount },
      ],
      sourceModule: "sales",
    });
    return res;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'écriture auto");
  }
}

/** Écriture automatique : achats (débit charge, crédit fournisseur/passif). */
export async function autoPostPurchaseEntry(ctx: AuthzContext, amount: number, label: string) {
  const orgId = ctx.organization!.id;
  const journal = await defaultJournal(ctx, orgId);
  const expense = await pickAccount(ctx, orgId, "expense");
  const liability = await pickAccount(ctx, orgId, "liability");
  if (!journal || !expense || !liability) return err("Comptabilité non configurée (journal + comptes charge/passif).");
  try {
    const res = await createJournalEntry(ctx, {
      journalId: journal.id,
      date: new Date().toISOString().slice(0, 10),
      label,
      lines: [
        { account: expense.id, label: "Achat", debit: amount, credit: 0 },
        { account: liability.id, label: "Fournisseur", debit: 0, credit: amount },
      ],
      sourceModule: "purchases",
    });
    return res;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'écriture auto");
  }
}

/** Écriture automatique : paie (débit charge, crédit banque/actif). */
export async function autoPostPayrollEntry(ctx: AuthzContext, amount: number, label: string) {
  const orgId = ctx.organization!.id;
  const journal = await defaultJournal(ctx, orgId);
  const expense = await pickAccount(ctx, orgId, "expense");
  const asset = await pickAccount(ctx, orgId, "asset");
  if (!journal || !expense || !asset) return err("Comptabilité non configurée (journal + comptes charge/actif).");
  try {
    const res = await createJournalEntry(ctx, {
      journalId: journal.id,
      date: new Date().toISOString().slice(0, 10),
      label,
      lines: [
        { account: expense.id, label: "Salaires", debit: amount, credit: 0 },
        { account: asset.id, label: "Banque", debit: 0, credit: amount },
      ],
      sourceModule: "hr",
    });
    return res;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'écriture auto");
  }
}

/** Écriture automatique : amortissement d'immobilisation. */
export async function autoPostDepreciationEntry(ctx: AuthzContext, amount: number, label: string) {
  const orgId = ctx.organization!.id;
  const journal = await defaultJournal(ctx, orgId);
  const expense = await pickAccount(ctx, orgId, "expense");
  const asset = await pickAccount(ctx, orgId, "asset");
  if (!journal || !expense || !asset) return err("Comptabilité non configurée (journal + comptes charge/actif).");
  try {
    const res = await createJournalEntry(ctx, {
      journalId: journal.id,
      date: new Date().toISOString().slice(0, 10),
      label,
      lines: [
        { account: expense.id, label: "Dotation aux amortissements", debit: amount, credit: 0 },
        { account: asset.id, label: "Amortissements", debit: 0, credit: amount },
      ],
      sourceModule: "assets",
    });
    return res;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'écriture auto");
  }
}

