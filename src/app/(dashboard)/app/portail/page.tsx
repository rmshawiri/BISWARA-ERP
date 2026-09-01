import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { findMyEmployee, listMyLeaveRequests, listMyContracts, listMyAttendance, listMyPayrolls, listMyAdvances } from "@/modules/portal";
import type { Employee, LeaveRequest, Contract, Attendance, Payroll, SalaryAdvance } from "@/db/schema";
import { PortalLeave } from "@/components/feature/portal/portal-leave";
import { PortalAdvance } from "@/components/feature/portal/portal-advance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRound, FileText, CalendarClock, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Portail Employé" };

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  interim: "Intérim",
  freelance: "Freelance",
};

export default async function PortailPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  let employee: Employee | null = null;
  let leaves: LeaveRequest[] = [];
  let contracts: Contract[] = [];
  let attendance: Attendance[] = [];
  let payrolls: Payroll[] = [];
  let advances: SalaryAdvance[] = [];
  const currency = ctx.organization?.currency ?? "KMF";
  try {
    const emp = await findMyEmployee(ctx);
    if (emp.ok) employee = emp.data;
    const lv = await listMyLeaveRequests(ctx);
    if (lv.ok) leaves = lv.data as LeaveRequest[];
    const ct = await listMyContracts(ctx);
    if (ct.ok) contracts = ct.data as Contract[];
    const at = await listMyAttendance(ctx);
    if (at.ok) attendance = at.data as Attendance[];
    const pr = await listMyPayrolls(ctx);
    if (pr.ok) payrolls = pr.data as Payroll[];
    const av = await listMyAdvances(ctx);
    if (av.ok) advances = av.data as SalaryAdvance[];
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserRound className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mon espace employé</h1>
          <p className="text-muted-foreground">Vos informations, votre contrat, vos présences et vos congés.</p>
        </div>
      </div>

      {!employee ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Aucun profil employé n'est associé à votre compte.
            <span className="mt-2 block text-xs">
              Pour profiter du portail, contactez votre administrateur afin que votre
              adresse e-mail BISWARA corresponde à votre fiche employé.
            </span>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Mon profil</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{employee.firstName} {employee.lastName}</p></div>
              <div><p className="text-xs text-muted-foreground">Poste</p><p className="font-medium">{employee.position ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Département</p><p className="font-medium">{employee.department ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Date d'embauche</p><p className="font-medium">{employee.hireDate ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Solde congés annuel</p><p className="font-medium">{employee.annualLeaveDays ?? 0} jours</p></div>
              <div><p className="text-xs text-muted-foreground">Statut</p><Badge variant={employee.status === "active" ? "success" : "warning"}>{employee.status}</Badge></div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0"><FileText className="h-4 w-4 text-primary" /><CardTitle className="text-base">Mon contrat</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contracts.length === 0 && <p className="text-sm text-muted-foreground">Aucun contrat.</p>}
                {contracts.map((c) => (
                  <div key={c.id} className="rounded-lg border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{CONTRACT_LABELS[c.contractType] ?? c.contractType}</span>
                      <Badge variant={c.status === "active" ? "success" : "secondary"}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p>{c.startDate ?? "—"} → {c.endDate ?? "—"}</p>
                      {c.baseSalary != null && <p>Salaire de base : {formatCurrency(Number(c.baseSalary), currency)}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0"><CalendarClock className="h-4 w-4 text-primary" /><CardTitle className="text-base">Mes présences / planning</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {attendance.length === 0 && <p className="text-sm text-muted-foreground">Aucune présence enregistrée.</p>}
                {attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <span>{a.workDate ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.clockIn ?? "—"} → {a.clockOut ?? "—"}
                    </span>
                    <Badge variant={a.status === "present" ? "success" : "secondary"}>{a.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0"><FileText className="h-4 w-4 text-primary" /><CardTitle className="text-base">Mes bulletins de paie</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payrolls.length === 0 && <p className="text-sm text-muted-foreground">Aucun bulletin de paie.</p>}
                {payrolls.map((p) => (
                  <div key={p.id} className="rounded-lg border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Période {p.period}</span>
                      <Badge variant={p.status === "paid" ? "success" : "secondary"}>{p.status}</Badge>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-muted-foreground">
                      <span>Brut : {formatCurrency(Number(p.gross ?? 0), currency)}</span>
                      <span>Retenues : -{formatCurrency(Number(p.deductions ?? 0), currency)}</span>
                      <span className="col-span-2 font-medium text-foreground">
                        Net : {formatCurrency(Number(p.net ?? 0), currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0"><Wallet className="h-4 w-4 text-primary" /><CardTitle className="text-base">Avances sur salaire</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <PortalAdvance />
                </div>
                <div className="space-y-2">
                  {advances.length === 0 && <p className="text-sm text-muted-foreground">Aucune avance demandée.</p>}
                  {advances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <span>{formatCurrency(Number(a.amount), currency)}</span>
                      <span className="truncate px-2 text-xs text-muted-foreground">{a.reason ?? ""}</span>
                      <Badge variant={a.status === "approved" ? "success" : a.status === "rejected" ? "destructive" : a.status === "paid" ? "info" : "warning"}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Mes congés</CardTitle></CardHeader>
            <CardContent>
              <PortalLeave
                leaves={leaves.map((l) => ({
                  id: l.id,
                  type: l.type,
                  startDate: l.startDate ?? "",
                  endDate: l.endDate ?? "",
                  days: l.days,
                  status: l.status,
                  notes: l.notes,
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
