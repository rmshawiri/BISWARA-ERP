"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Download, Upload, RefreshCcw } from "lucide-react";
import { exportBackupAction, resetDataAction, importBackupAction } from "@/server/backup-actions";
import { Button } from "@/components/ui/button";

export function BackupManager() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);

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

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de ré-sélectionner le même fichier
    if (!file) return;
    if (
      !confirm(
        "Importer et RESTAURER les données de cette sauvegarde dans votre organisation ?\n" +
          "Les données restaurées écraseront les enregistrements correspondants (mêmes identifiants). Cette action est journalisée."
      )
    )
      return;

    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result ?? "");
      startTransition(async () => {
        const res = await importBackupAction(json);
        if (res.ok) {
          toast.success(`Sauvegarde importée (${res.data.restored} enregistrement(s) restauré(s)).`);
          router.refresh();
        } else {
          toast.error(res.error ?? "Import impossible.");
        }
      });
    };
    reader.onerror = () => toast.error("Impossible de lire le fichier.");
    reader.readAsText(file);
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
        Exportez l'ensemble des données métier de votre organisation (JSON), importez
        une sauvegarde, ou réinitialisez complètement la base (les comptes et paramètres
        sont conservés).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={exportBackup}>
          <Download className="mr-1 h-4 w-4" />
          Exporter la sauvegarde
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" />
          Importer une sauvegarde
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportFile}
        />
        <Button variant="destructive" disabled={pending} onClick={resetData}>
          <RefreshCcw className="mr-1 h-4 w-4" />
          Réinitialiser les données
        </Button>
      </div>
    </div>
  );
}
