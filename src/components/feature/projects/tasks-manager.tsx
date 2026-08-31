"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { createTaskAction, updateTaskProgressAction } from "@/modules/projects/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TasksManager({
  projectId,
  projectName,
  tasks,
}: {
  projectId: string;
  projectName: string;
  tasks: { id: string; title: string; progress: number; done: boolean; status: string; dueDate: string | null }[];
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");

  function add() {
    if (!title.trim()) return;
    createTaskAction({ projectId, title }).then((res) => {
      if (res.ok) { toast.success("Tâche ajoutée"); setTitle(""); }
      else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function setProgress(id: string, progress: number) {
    updateTaskProgressAction(id, progress).then((res) => {
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  const done = tasks.filter((t) => t.done).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Tâches — {projectName}</CardTitle>
        <Badge variant="secondary">{done}/{tasks.length} terminées</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nouvelle tâche…"
            className="h-8 flex-1"
          />
          <Button size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Aucune tâche.</p>}
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2">
              <button
                onClick={() => setProgress(t.id, t.done ? 0 : 100)}
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded border",
                  t.done ? "bg-primary text-white" : "hover:bg-muted"
                )}
                aria-label={t.done ? "Réouvrir" : "Terminer"}
              >
                {t.done && <Check className="h-3 w-3" />}
              </button>
              <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>{t.title}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={t.progress}
                onChange={(e) => setProgress(t.id, Number(e.target.value))}
                className="w-24"
                aria-label="Avancement"
              />
              <span className="w-10 text-right text-xs tabular-nums">{t.progress}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
