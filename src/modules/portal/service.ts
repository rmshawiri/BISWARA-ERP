import "server-only";

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { employees, leaveRequests, contracts, attendance } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { logAudit } from "@/engines/audit";
import { err, ok, Result } from "@/lib/result";

function requireOrg(ctx: AuthzContext) {
  if (!ctx.organization) throw new Error("Organisation introuvable.");
  return ctx.organization.id;
}

/** Associe l'utilisateur connecté à un profil employé (via adresse e-mail). */
export async function findMyEmployee(ctx: AuthzContext) {
  try {
    const orgId = requireOrg(ctx);
    if (!ctx.user.email) return ok(null);
    const rows = await db()
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, orgId), eq(employees.email, ctx.user.email)))
      .limit(1);
    return ok(rows[0] ?? null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Demande de congé en self-service (sans droit RH admin). */
export async function requestSelfLeave(
  ctx: AuthzContext,
  input: { type: string; startDate: string; endDate: string; days: number; notes?: string | null }
) {
  try {
    const orgId = requireOrg(ctx);
    const empRes = await findMyEmployee(ctx);
    if (!empRes.ok || !empRes.data) return err("Aucun profil employé associé à votre compte.");
    const emp = empRes.data;
    const row = await db()
      .insert(leaveRequests)
      .values({
        organizationId: orgId,
        employeeId: emp.id,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        notes: input.notes ?? null,
        status: "pending",
      })
      .returning();
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "employee_portal",
      action: "leave.request",
      entityType: "leave_request",
      entityId: row[0]?.id ?? null,
    });
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de demande");
  }
}

/** Mes demandes de congé (self-service). */
export async function listMyLeaveRequests(ctx: AuthzContext) {
  try {
    const empRes = await findMyEmployee(ctx);
    if (!empRes.ok || !empRes.data) return ok([]);
    const rows = await db()
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, empRes.data.id))
      .orderBy(desc(leaveRequests.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Mes contrats (self-service — l'employé ne voit que ses propres infos). */
export async function listMyContracts(ctx: AuthzContext) {
  try {
    const empRes = await findMyEmployee(ctx);
    if (!empRes.ok || !empRes.data) return ok([]);
    const rows = await db()
      .select()
      .from(contracts)
      .where(eq(contracts.employeeId, empRes.data.id))
      .orderBy(desc(contracts.startDate));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Mes présences / planning (self-service). */
export async function listMyAttendance(ctx: AuthzContext) {
  try {
    const empRes = await findMyEmployee(ctx);
    if (!empRes.ok || !empRes.data) return ok([]);
    const rows = await db()
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, empRes.data.id))
      .orderBy(desc(attendance.workDate))
      .limit(30);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
