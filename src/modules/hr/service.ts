import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { employees, leaveRequests } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.HR, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listEmployees(
  ctx: AuthzContext
): Promise<Result<typeof employees.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(employees)
      .where(eq(employees.organizationId, orgId))
      .orderBy(desc(employees.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createEmployee(
  ctx: AuthzContext,
  input: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    department?: string | null;
    hireDate?: string | null;
    annualLeaveDays?: number;
  }
): Promise<Result<typeof employees.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(employees)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.HR,
      action: "employee.create",
      entityType: "employee",
      entityId: row.id,
      newValue: { name: `${row.firstName} ${row.lastName}` },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listLeaveRequests(
  ctx: AuthzContext
): Promise<Result<typeof leaveRequests.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.organizationId, orgId))
      .orderBy(desc(leaveRequests.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
