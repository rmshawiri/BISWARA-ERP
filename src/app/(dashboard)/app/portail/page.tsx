import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { findMyEmployee, listMyLeaveRequests } from "@/modules/portal";
import type { Employee, LeaveRequest } from "@/db/schema";
import { PortalLeave } from "@/components/feature/portal/portal-leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Portail Employé" };

export default async function PortailPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  let employee: Employee | null = null;
  let leaves: LeaveRequest[] = [];
  try {
    const emp = await findMyEmployee(ctx);
    if (emp.ok) employee = emp.data;
    const lv = await listMyLeaveRequests(ctx);
    if (lv.ok) leaves = lv.data as LeaveRequest[];
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserRound className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mon espace employé</h1>
          <p className="text-muted-foreground">Vos informations et vos demandes de congés.</p>
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
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
