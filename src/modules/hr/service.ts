import "server-only";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { employees, leaveRequests, contracts, attendance, payrolls } from "@/db/schema";
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

/** Crée une demande de congé (statut pending). */
export async function createLeaveRequest(
  ctx: AuthzContext,
  input: {
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    notes?: string | null;
  }
): Promise<Result<typeof leaveRequests.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(leaveRequests)
      .values({
        organizationId: orgId,
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        notes: input.notes ?? null,
        status: "pending",
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.HR,
      action: "leave.create",
      entityType: "leave_request",
      entityId: row.id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Approuve / rejette une demande de congé. */
export async function decideLeave(
  ctx: AuthzContext,
  id: string,
  decision: "approved" | "rejected"
): Promise<Result<typeof leaveRequests.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(leaveRequests)
      .set({ status: decision })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)))
      .returning();
    if (!row) return err("Demande introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.HR,
      action: `leave.${decision}`,
      entityType: "leave_request",
      entityId: id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de décision");
  }
}

/* ---- Contrats ---- */
export async function listContracts(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(contracts).where(eq(contracts.organizationId, ctx.organization!.id)).orderBy(contracts.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createContract(ctx: AuthzContext, input: { employeeId: string; contractType: string; startDate?: string | null; endDate?: string | null; baseSalary: number }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(contracts).values({ organizationId: orgId, employeeId: input.employeeId, contractType: input.contractType, startDate: input.startDate ?? null, endDate: input.endDate ?? null, baseSalary: input.baseSalary }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/* ---- Présences ---- */
export async function listAttendance(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(attendance).where(eq(attendance.organizationId, ctx.organization!.id)).orderBy(attendance.workDate);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function recordAttendance(ctx: AuthzContext, input: { employeeId: string; workDate: string; status: string; clockIn?: string | null; clockOut?: string | null; notes?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(attendance).values({ organizationId: orgId, employeeId: input.employeeId, workDate: input.workDate, status: input.status, clockIn: input.clockIn ?? null, clockOut: input.clockOut ?? null, notes: input.notes ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/* ---- Paie ---- */
export async function listPayrolls(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(payrolls).where(eq(payrolls.organizationId, ctx.organization!.id)).orderBy(payrolls.period);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Génère un bulletin de paie (gross = base + bonus ; net = gross - deductions). */
export async function generatePayroll(ctx: AuthzContext, input: { employeeId: string; period: string; baseSalary: number; bonus?: number; deductions?: number }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const gross = Number(input.baseSalary) + Number(input.bonus ?? 0);
    const net = gross - Number(input.deductions ?? 0);
    const [row] = await db().insert(payrolls).values({ organizationId: orgId, employeeId: input.employeeId, period: input.period, baseSalary: input.baseSalary, bonus: input.bonus ?? 0, deductions: input.deductions ?? 0, gross, net, status: "draft" }).returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.HR,
      action: "payroll.generate",
      entityType: "payroll",
      entityId: row.id,
      newValue: { period: row.period, gross, net },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de génération");
  }
}

/** Valide un bulletin (statut). */
export async function setPayrollStatus(ctx: AuthzContext, id: string, status: string) {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().update(payrolls).set({ status }).where(and(eq(payrolls.id, id), eq(payrolls.organizationId, orgId))).returning();
    if (!row) return err("Bulletin introuvable.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
