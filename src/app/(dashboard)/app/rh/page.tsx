import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listEmployees, listLeaveRequests, listContracts, listAttendance, listPayrolls } from "@/modules/hr";
import { leaveBalance } from "@/modules/hr";
import type { Employee, LeaveRequest, Contract, Attendance, Payroll } from "@/db/schema";
import { NewEmployeeButton } from "@/components/feature/hr/new-employee-button";
import { LeaveManager } from "@/components/feature/hr/leave-manager";
import { RhAdvanced } from "@/components/feature/hr/rh-advanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays } from "lucide-react";

export const metadata: Metadata = { title: "Ressources Humaines" };

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annuel",
  sick: "Maladie",
  personal: "Personnel",
  other: "Autre",
};

const LEAVE_STATUS: Record<string, "info" | "success" | "warning" | "destructive"> = {
  pending: "info",
  approved: "success",
  rejected: "destructive",
};

export default async function RhPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let employees: Employee[] = [];
  let leaves: LeaveRequest[] = [];
  let contracts: Contract[] = [];
  let attendance: Attendance[] = [];
  let payrolls: Payroll[] = [];
  let dbReady = true;
  try {
    const [e, l, c, a, p] = await Promise.all([
      listEmployees(ctx), listLeaveRequests(ctx), listContracts(ctx), listAttendance(ctx), listPayrolls(ctx),
    ]);
    if (e.ok) employees = e.data;
    if (l.ok) leaves = l.data;
    if (c.ok) contracts = c.data;
    if (a.ok) attendance = a.data;
    if (p.ok) payrolls = p.data;
  } catch {
    dbReady = false;
  }

  const employeeById = new Map(employees.map((x) => [x.id, x]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ressources Humaines</h1>
          <p className="text-muted-foreground">
            Employés, congés et présences.
          </p>
        </div>
        <NewEmployeeButton />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0006_hr.sql</code> dans Supabase pour activer ce
            module.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Congés */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Demandes de congés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune demande de congé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Employé</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Du</th>
                      <th className="pb-2 pr-4">Au</th>
                      <th className="pb-2 pr-4">Jours</th>
                      <th className="pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((lv) => {
                      const emp = employeeById.get(lv.employeeId);
                      return (
                        <tr key={lv.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">
                            {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {LEAVE_TYPE_LABELS[lv.type] ?? lv.type}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{lv.startDate ?? "—"}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{lv.endDate ?? "—"}</td>
                          <td className="py-3 pr-4 tabular-nums">{lv.days}</td>
                          <td className="py-3">
                            <Badge variant={LEAVE_STATUS[lv.status] ?? "secondary"}>
                              {lv.status === "pending" ? "En attente" : lv.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Employés ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {employees.map((e) => {
                const balance = leaveBalance({
                  entitlement: e.annualLeaveDays ?? 0,
                  taken: 0,
                  requested: 0,
                });
                return (
                  <li key={e.id} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.firstName} {e.lastName}</span>
                      <Badge variant="secondary">{e.position ?? "—"}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.department ?? "—"} · {balance.available} j de congés
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <LeaveManager
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        leaves={leaves.map((lv) => ({
          id: lv.id,
          employeeName: (() => {
            const emp = employeeById.get(lv.employeeId);
            return emp ? `${emp.firstName} ${emp.lastName}` : "—";
          })(),
          type: LEAVE_TYPE_LABELS[lv.type] ?? lv.type,
          startDate: lv.startDate ?? "",
          endDate: lv.endDate ?? "",
          days: lv.days,
          status: lv.status,
        }))}
      />

      <RhAdvanced
        employees={employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` }))}
        contracts={contracts.map((c) => ({
          id: c.id,
          employeeName: employeeById.get(c.employeeId)?.firstName
            ? `${employeeById.get(c.employeeId)?.firstName} ${employeeById.get(c.employeeId)?.lastName}`
            : "—",
          contractType: c.contractType,
          startDate: c.startDate,
          endDate: c.endDate,
          baseSalary: Number(c.baseSalary),
        }))}
        attendance={attendance.map((a) => ({
          id: a.id,
          employeeName: employeeById.get(a.employeeId)?.firstName
            ? `${employeeById.get(a.employeeId)?.firstName} ${employeeById.get(a.employeeId)?.lastName}`
            : "—",
          workDate: a.workDate ?? "",
          status: a.status,
        }))}
        payrolls={payrolls.map((p) => ({
          id: p.id,
          employeeName: employeeById.get(p.employeeId)?.firstName
            ? `${employeeById.get(p.employeeId)?.firstName} ${employeeById.get(p.employeeId)?.lastName}`
            : "—",
          period: p.period,
          gross: Number(p.gross),
          net: Number(p.net),
          status: p.status,
        }))}
        currency={ctx.organization?.currency ?? "KMF"}
      />
    </div>
  );
}
