import "server-only";

import { eq, desc, and, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";

export interface AuditFilter {
  module?: string;
  action?: string;
  search?: string;
  level?: string;
}

/** Journal d'audit de l'organisation (les journaux sont immuables). */
export async function listAuditLogs(
  ctx: AuthzContext,
  filter: AuditFilter = {}
): Promise<Result<typeof auditLogs.$inferSelect[]>> {
  try {
    if (!ctx.organization) return ok([]);

    const conds: SQL[] = [eq(auditLogs.organizationId, ctx.organization.id)];
    if (filter.module) conds.push(eq(auditLogs.module, filter.module));
    if (filter.action) conds.push(eq(auditLogs.action, filter.action));
    if (filter.level) conds.push(eq(auditLogs.level, filter.level));
    if (filter.search) {
      const p = `%${filter.search}%`;
      conds.push(ilike(auditLogs.userName, p));
    }

    const rows = await db()
      .select()
      .from(auditLogs)
      .where(and(...conds))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
