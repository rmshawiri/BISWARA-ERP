import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { logAudit } from "@/engines/audit";
import { err, ok, Result } from "@/lib/result";

function requireOrgUser(ctx: AuthzContext) {
  if (!ctx.organization) throw new Error("Organisation introuvable.");
  return ctx.organization.id;
}
function requireSuper(ctx: AuthzContext) {
  if (!ctx.superAdmin) throw new Error("Accès réservé au Super Admin.");
}

export interface CreateTicketInput {
  subject: string;
  category: string;
  priority: string;
  message: string;
}

/** Liste les tickets de l'organisation connectée. */
export async function listOrgTickets(ctx: AuthzContext) {
  try {
    const orgId = requireOrgUser(ctx);
    const rows = await db()
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.organizationId, orgId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(100);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée un ticket de support pour l'organisation. */
export async function createTicket(ctx: AuthzContext, input: CreateTicketInput) {
  try {
    const orgId = requireOrgUser(ctx);
    const [row] = await db()
      .insert(supportTickets)
      .values({
        organizationId: orgId,
        userId: ctx.user.id,
        userName: ctx.user.fullName,
        subject: input.subject,
        category: input.category || "general",
        priority: input.priority || "normal",
        status: "open",
        message: input.message,
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "support",
      action: "ticket.create",
      entityType: "support_ticket",
      entityId: row.id,
      newValue: { subject: input.subject, priority: input.priority },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Liste tous les tickets (Super Admin). */
export async function listAllTickets(ctx: AuthzContext) {
  try {
    requireSuper(ctx);
    const rows = await db()
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Change le statut d'un ticket (Super Admin). */
export async function updateTicketStatus(ctx: AuthzContext, id: string, status: string) {
  try {
    requireSuper(ctx);
    if (!["open", "in_progress", "answered", "closed"].includes(status)) {
      return err("Statut invalide.");
    }
    const [row] = await db()
      .update(supportTickets)
      .set({ status })
      .where(eq(supportTickets.id, id))
      .returning();
    if (!row) return err("Ticket introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: row.organizationId,
      module: "support",
      action: `ticket.${status}`,
      entityType: "support_ticket",
      entityId: id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
