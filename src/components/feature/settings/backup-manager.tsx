"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Download, RefreshCcw } from "lucide-react";
import { exportBackupAction, resetDataAction } from "@/server/backup-actions";
import { Button } from "@/components/ui/button";

export function BackupManager() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function exportBackup() {
    startTransition(async () => {
      const res = await exportBackupAction();
      if (res.ok) {
        const blob = new Blob([res.data.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Sauvegarde exportée.");
      } else {
        toast.error(res.error ?? "Export impossible.");
      }
    });
  }

  function resetData() {
    if (
      !confirm(
        "Réinitialiser COMPLÈTEMENT les données de votre organisation ?\nCette action est IRRÉVERSIBLE (les utilisateurs et paramètres sont conservés)."
      )
    )
      return;
    if (!confirm("Confirmer la réinitialisation définitive ?")) return;
    startTransition(async () => {
      const res = await resetDataAction();
      if (res.ok) {
        toast.success("Données réinitialisées.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Réinitialisation impossible.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Exportez l'ensemble des données métier de votre organisation (JSON), ou
        réinitialisez complètement la base (les comptes et paramètres sont conservés).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={exportBackup}>
          <Download className="mr-1 h-4 w-4" />
          Exporter la sauvegarde
        </Button>
        <Button variant="destructive" disabled={pending} onClick={resetData}>
          <RefreshCcw className="mr-1 h-4 w-4" />
          Réinitialiser les données
        </Button>
      </div>
    </div>
  );
}
