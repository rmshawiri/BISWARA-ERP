"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateSystemSettingAction } from "@/modules/platform/system-settings-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Wrench } from "lucide-react";

export function MaintenanceToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = React.useState(enabled);
  const [pending, startTransition] = React.useTransition();

  function toggle(value: boolean) {
    setOn(value);
    startTransition(async () => {
      const res = await updateSystemSettingAction("maintenance_enabled", String(value));
      if (res.ok) toast.success(value ? "Mode maintenance activé." : "Mode maintenance désactivé.");
      else {
        toast.error(res.error ?? "Action impossible.");
        setOn(!value);
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Wrench className="h-4 w-4" />
        <CardTitle className="text-base">Mode maintenance</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="max-w-sm text-sm text-muted-foreground">
          Suspendre l&apos;accès à l&apos;espace de travail pendant une
          intervention. La page publique et l&apos;administration restent accessibles.
        </p>
        <Switch checked={on} onCheckedChange={toggle} disabled={pending} />
      </CardContent>
    </Card>
  );
}
