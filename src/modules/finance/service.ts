import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { accounts, cashSessions, financialTransactions } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result, tryCatch } from "@/lib/result";
import { cashBalance } from "./logic";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.FINANCE, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listAccounts(
  ctx: AuthzContext
): Promise<Result<typeof accounts.$inferSelect[]>> {
  requirePerm(ctx, "view");
  try {
    const result = await db()
      .select()
      .from(accounts)
      .where(eq(accounts.organizationId, ctx.organization!.id));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createAccount(
  ctx: AuthzContext,
  input: { name: string; type: string; currency?: string; openingBalance?: number }
): Promise<Result<typeof accounts.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(accounts)
      .values({
        organizationId: orgId,
        name: input.name,
        type: input.type,
        currency: input.currency ?? "KMF",
        openingBalance: input.openingBalance ?? 0,
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.FINANCE,
      action: "account.create",
      entityType: "account",
      entityId: row.id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Ouvre une caisse (session) avec un fonds initial. */
export async function openCashSession(
  ctx: AuthzContext,
  accountId: string,
  openingBalance: number
): Promise<Result<typeof cashSessions.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  return tryCatch(async () => {
    const [row] = await db()
      .insert(cashSessions)
      .values({
        organizationId: orgId,
        accountId,
        openedBy: ctx.user.id,
        openedAt: new Date().toISOString(),
        openingBalance,
        status: "open",
      })
      .returning();
    if (!row) throw new Error("Impossible d'ouvrir la caisse.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.FINANCE,
      action: "cash_session.open",
      entityType: "cash_session",
      entityId: row.id,
    });
    return row;
  });
}

/** Ferme une caisse : calcule le solde théorique, l'écart et exige une justification. */
export async function closeCashSession(
  ctx: AuthzContext,
  sessionId: string,
  realBalance: number,
  inflows: number,
  outflows: number,
  justification: string
): Promise<Result<typeof cashSessions.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  return tryCatch(async () => {
    const [existing] = await db()
      .select()
      .from(cashSessions)
      .where(and(eq(cashSessions.id, sessionId), eq(cashSessions.organizationId, orgId)))
      .limit(1);
    if (!existing) throw new Error("Session introuvable.");

    const { theoretical, gap } = cashBalance(
      Number(existing.openingBalance),
      inflows,
      outflows,
      realBalance
    );

    const [row] = await db()
      .update(cashSessions)
      .set({
        closedAt: new Date().toISOString(),
        theoreticalBalance: theoretical,
        realBalance,
        gap,
        justification: gap !== 0 ? justification : existing.justification,
        status: "closed",
      })
      .where(eq(cashSessions.id, sessionId))
      .returning();
    if (!row) throw new Error("Clôture impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.FINANCE,
      action: "cash_session.close",
      entityType: "cash_session",
      entityId: row.id,
      newValue: { gap },
    });
    return row;
  });
}

/** Enregistre une transaction financière (encaissement / décaissement). */
export async function recordTransaction(
  ctx: AuthzContext,
  input: {
    accountId: string;
    direction: "in" | "out" | "transfer";
    amount: number;
    method: string;
    reference?: string | null;
    date?: string | null;
    notes?: string | null;
  }
): Promise<Result<typeof financialTransactions.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(financialTransactions)
      .values({
        ...input,
        organizationId: orgId,
        date: input.date ?? new Date().toISOString().slice(0, 10),
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.FINANCE,
      action: `transaction.${input.direction}`,
      entityType: "transaction",
      entityId: row.id,
      newValue: { amount: input.amount, method: input.method },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
