"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CsvRow {
  type: string;
  number: string;
  customer: string;
  date: string;
  status: string;
  total: number;
}

export function ExportCsvButton({ rows, filename }: { rows: CsvRow[]; filename: string }) {
  function exportCsv() {
    if (rows.length === 0) {
      toast.error("Aucune donnée à exporter.");
      return;
    }
    const header = "Type;Numéro;Client;Date;Statut;Total";
    const body = rows
      .map((r) =>
        [r.type, r.number, r.customer, r.date, r.status, r.total].join(";")
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé.");
  }

  return (
    <Button variant="outline" size="sm" onClick={exportCsv}>
      <Download className="mr-1 h-3.5 w-3.5" />
      Exporter CSV
    </Button>
  );
}
