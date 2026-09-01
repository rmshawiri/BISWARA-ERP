import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { getAuthzContext } from "@/server/auth";
import { listAllTickets } from "@/modules/support";
import type { SupportTicket } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketStatusSelect } from "@/components/feature/support/ticket-status-select";

export const metadata: Metadata = { title: "Support — Admin" };

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "default" | "destructive"> = {
  open: "info",
  in_progress: "secondary",
  answered: "success",
  closed: "default",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  answered: "Répondu",
  closed: "Clôturé",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Basse", normal: "Normale", high: "Haute", critical: "Critique" };

export default async function AdminSupportPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let tickets: SupportTicket[] = [];
  try {
    const res = await listAllTickets(ctx);
    if (res.ok) tickets = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Centre de support</h1>
        <p className="text-muted-foreground">
          Demandes d&apos;assistance des organisations (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy className="h-4 w-4" />
            Tickets ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="Aucun ticket" description="Aucune demande d'assistance à ce jour." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Organisation</th>
                    <th className="pb-2 pr-4">Objet</th>
                    <th className="pb-2 pr-4">Catégorie</th>
                    <th className="pb-2 pr-4">Priorité</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">{t.userName ?? "—"}</td>
                      <td className="py-3 pr-4 font-medium">{t.subject}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{t.category}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={t.priority === "critical" ? "destructive" : "secondary"}>
                          {PRIORITY_LABELS[t.priority] ?? t.priority}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUS_BADGE[t.status] ?? "secondary"}>
                          {STATUS_LABELS[t.status] ?? t.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {t.createdAt?.toLocaleDateString("fr-FR") ?? "—"}
                      </td>
                      <td className="py-3">
                        <TicketStatusSelect id={t.id} status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
