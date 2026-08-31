import "server-only";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectTasks } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.PROJECTS, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listProjects(
  ctx: AuthzContext
): Promise<Result<typeof projects.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(projects)
      .where(eq(projects.organizationId, orgId))
      .orderBy(desc(projects.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createProject(
  ctx: AuthzContext,
  input: {
    name: string;
    description?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  }
): Promise<Result<typeof projects.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(projects)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.PROJECTS,
      action: "project.create",
      entityType: "project",
      entityId: row.id,
      newValue: { name: row.name },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Liste les tâches d'un projet. */
export async function listTasks(ctx: AuthzContext, projectId: string) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(projectTasks)
      .where(and(eq(projectTasks.organizationId, orgId), eq(projectTasks.projectId, projectId)))
      .orderBy(projectTasks.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée une tâche dans un projet. */
export async function createTask(
  ctx: AuthzContext,
  projectId: string,
  input: { title: string; dueDate?: string | null; weight?: number }
) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(projectTasks)
      .values({
        organizationId: orgId,
        projectId,
        title: input.title,
        dueDate: input.dueDate ?? null,
        weight: input.weight ?? 1,
      })
      .returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Met à jour l'avancement / statut d'une tâche. */
export async function updateTaskProgress(
  ctx: AuthzContext,
  taskId: string,
  progress: number,
  status?: string
) {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(projectTasks)
      .set({ progress, done: progress >= 100, ...(status ? { status } : {}) })
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.organizationId, orgId)))
      .returning();
    if (!row) return err("Tâche introuvable.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
