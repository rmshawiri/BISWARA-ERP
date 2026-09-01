import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { requireModuleAccess } from "@/server/module-gate";
import { MODULES } from "@/lib/constants";
import { listProjects, listTasks, isOverdue } from "@/modules/projects";
import type { Project, ProjectTask } from "@/db/schema";
import { NewProjectButton } from "@/components/feature/projects/new-project-button";
import { TasksManager } from "@/components/feature/projects/tasks-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";

export const metadata: Metadata = { title: "Gestion de Projets" };

export default async function ProjetsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");
  await requireModuleAccess(ctx, MODULES.PROJECTS);

  let projects: Project[] = [];
  const tasksByProject: Record<string, ProjectTask[]> = {};
  let dbReady = true;
  try {
    const res = await listProjects(ctx);
    if (res.ok) projects = res.data;
    for (const p of projects) {
      const t = await listTasks(ctx, p.id);
      if (t.ok) tasksByProject[p.id] = t.data;
    }
  } catch {
    dbReady = false;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Projets</h1>
          <p className="text-muted-foreground">Projets, échéances et avancement.</p>
        </div>
        <NewProjectButton />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0007_projects.sql</code> dans Supabase pour activer
            ce module.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun projet pour le moment.
          </p>
        )}
        {projects.map((p) => {
          const overdue = p.dueDate ? isOverdue(p.dueDate, today) : false;
          return (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-semibold">{p.name}</h3>
                  </div>
                </div>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {p.startDate && <span>Début : {p.startDate}</span>}
                  {p.dueDate && <span>Échéance : {p.dueDate}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={p.status === "active" ? "info" : p.status === "done" ? "success" : "warning"}>
                    {p.status === "active" ? "En cours" : p.status}
                  </Badge>
                  {overdue && <Badge variant="destructive">En retard</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((p) => (
            <TasksManager
              key={p.id}
              projectId={p.id}
              projectName={p.name}
              tasks={(tasksByProject[p.id] ?? []).map((t) => ({
                id: t.id,
                title: t.title,
                progress: t.progress,
                done: t.done,
                status: t.status,
                dueDate: t.dueDate,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
