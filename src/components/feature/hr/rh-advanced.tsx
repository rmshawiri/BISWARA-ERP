"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createContractAction, recordAttendanceAction, generatePayrollAction, setPayrollStatusAction } from "@/modules/hr/rh-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function RhAdvanced({
  employees,
  contracts,
  attendance,
  payrolls,
  currency,
}: {
  employees: { id: string; label: string }[];
  contracts: { id: string; employeeName: string; contractType: string; startDate: string | null; endDate: string | null; baseSalary: number }[];
  attendance: { id: string; employeeName: string; workDate: string; status: string }[];
  payrolls: { id: string; employeeName: string; period: string; gross: number; net: number; status: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"contracts" | "attendance" | "payrolls">("contracts");

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    fn().then((res) => {
      if (res.ok) { toast.success(label); router.refresh(); }
      else toast.error(res.error ?? "Erreur");
    });
  }

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "contracts", label: "Contrats", count: contracts.length },
    { key: "attendance", label: "Présences", count: attendance.length },
    { key: "payrolls", label: "Paie", count: payrolls.length },
  ];

  const empName = (id: string) => employees.find((e) => e.id === id)?.label ?? "—";
  const EMPLOYEE_VALUES = employees.map((e) => e.label);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">RH avancé</CardTitle>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${tab === t.key ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tab === "contracts" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const name = prompt("Employé (nom)") ; const emp = employees.find((e) => e.label === name); if (!emp) return toast.error("Employé introuvable (utilisez le nom exact)."); const type = prompt("Type (cdi/cdd/stage)") || "cdi"; const baseSalary = Number(prompt("Salaire de base (KMF)") ?? 0); run("Contrat créé", () => createContractAction({ employeeId: emp.id, contractType: type, baseSalary })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nouveau contrat
            </Button>
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span className="font-medium">{c.employeeName}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{c.contractType}</Badge>
                  {formatCurrency(c.baseSalary, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
        {tab === "attendance" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const name = prompt("Employé (nom)"); const emp = employees.find((e) => e.label === name); if (!emp) return toast.error("Employé introuvable."); const d = prompt("Date (YYYY-MM-DD)") || new Date().toISOString().slice(0, 10); const st = prompt("Statut (present/late/absent/leave)") || "present"; run("Présence enregistrée", () => recordAttendanceAction({ employeeId: emp.id, workDate: d, status: st })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Pointer
            </Button>
            {attendance.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{a.employeeName} · {a.workDate}</span>
                <Badge variant="secondary">{a.status}</Badge>
              </div>
            ))}
          </div>
        )}
        {tab === "payrolls" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const name = prompt("Employé (nom)"); const emp = employees.find((e) => e.label === name); if (!emp) return toast.error("Employé introuvable."); const period = prompt("Période (YYYY-MM)") || new Date().toISOString().slice(0, 7); const base = Number(prompt("Salaire de base (KMF)") ?? 0); const bonus = Number(prompt("Prime") ?? 0); const ded = Number(prompt("Retenues") ?? 0); run("Bulletin généré", () => generatePayrollAction({ employeeId: emp.id, period, baseSalary: base, bonus, deductions: ded })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Générer un bulletin
            </Button>
            {payrolls.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{p.employeeName} · {p.period}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{formatCurrency(p.net, currency)}</span>
                  <Badge variant={p.status === "validated" ? "success" : "secondary"}>{p.status}</Badge>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
