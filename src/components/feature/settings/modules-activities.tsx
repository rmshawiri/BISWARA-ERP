"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Boxes, Sparkles } from "lucide-react";
import { toggleOrgModuleAction, toggleOrgActivityAction } from "@/modules/activities/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function ModulesActivitiesManager({
  modules,
  orgModules,
  activities,
  orgActivities,
}: {
  modules: { id: string; name: string; description: string | null }[];
  orgModules: { moduleId: string; active: boolean }[];
  activities: { id: string; name: string; description: string | null }[];
  orgActivities: { activityId: string; active: boolean }[];
}) {
  const router = useRouter();
  const moduleActive = new Map(orgModules.map((m) => [m.moduleId, m.active]));
  const activityActive = new Map(orgActivities.map((a) => [a.activityId, a.active]));

  function toggleModule(id: string, on: boolean) {
    toggleOrgModuleAction(id, on).then((res) => {
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  function toggleActivity(id: string, on: boolean) {
    toggleOrgActivityAction(id, on).then((res) => {
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Boxes className="h-4 w-4" />
          <CardTitle className="text-base">Modules de base</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun module catalogue.</p>
          )}
          {modules.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="min-w-0">
                <p className="font-medium">{m.name}</p>
                {m.description && <p className="truncate text-xs text-muted-foreground">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={moduleActive.get(m.id) ? "success" : "secondary"}>
                  {moduleActive.get(m.id) ? "Activé" : "Désactivé"}
                </Badge>
                <Switch checked={moduleActive.get(m.id) ?? false} onCheckedChange={(v) => toggleModule(m.id, v)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Sparkles className="h-4 w-4" />
          <CardTitle className="text-base">Activités métier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune activité catalogue.</p>
          )}
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="min-w-0">
                <p className="font-medium">{a.name}</p>
                {a.description && <p className="truncate text-xs text-muted-foreground">{a.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={activityActive.get(a.id) ? "success" : "secondary"}>
                  {activityActive.get(a.id) ? "Activée" : "Désactivée"}
                </Badge>
                <Switch checked={activityActive.get(a.id) ?? false} onCheckedChange={(v) => toggleActivity(a.id, v)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
