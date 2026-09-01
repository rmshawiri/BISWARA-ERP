import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { getAuthzContext } from "@/server/auth";
import { listOrgTickets } from "@/modules/support";
import type { SupportTicket } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NewTicketButton } from "@/components/feature/support/new-ticket-button";

export const metadata: Metadata = { title: "Support" };

const STATUS_LABELS: Record<string, { label: string; variant: "secondary" | "info" | "success" | "default" | "destructive" }> = {
  open: { label: "Ouvert", variant: "info" },
  in_progress: { label: "En cours", variant: "secondary" },
  answered: { label: "Répondu", variant: "success" },
  closed: { label: "Clôturé", variant: "default" },
};
const PRIORITY_LABELS: Record<string, string> = { low: "Basse", normal: "Normale", high: "Haute", critical: "Critique" };

export default async function SupportPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  let tickets: SupportTicket[] = [];
  try {
    const res = await listOrgTickets(ctx);
    if (res.ok) tickets = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Centre de support</h1>
            <p className="text-muted-foreground">
              Ouvrez un ticket, notre équipe vous répondra.
            </p>
          </div>
        </div>
        <NewTicketButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="Aucun ticket" description="Créez votre premier ticket pour obtenir de l'aide." />
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => {
                const st = STATUS_LABELS[t.status] ?? { label: t.status, variant: "secondary" as const };
                return (
                  <li key={t.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.subject}</span>
                        <Badge variant="secondary">{t.category}</Badge>
                        <Badge variant={t.priority === "critical" ? "destructive" : "secondary"}>
                          {PRIORITY_LABELS[t.priority] ?? t.priority}
                        </Badge>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{t.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t.createdAt?.toLocaleString("fr-FR") ?? "—"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
