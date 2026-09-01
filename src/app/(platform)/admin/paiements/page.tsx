import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSubscriptionPayments, listSubscriptions, type AdminSubscriptionPayment } from "@/modules/platform";
import { RecordSubscriptionPaymentButton } from "@/components/feature/platform/record-subscription-payment";
import { PaymentStatusActions } from "@/components/feature/platform/payment-status-actions";
import { AdminTableFilters } from "@/components/feature/platform/admin-table-filters";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Paiements — Admin" };

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  validated: { label: "Validé", variant: "success" },
  refused: { label: "Refusé", variant: "destructive" },
  canceled: { label: "Annulé", variant: "warning" },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  mvola: "Mvola",
  holo: "Holo",
  wakati: "Wakati",
  bank: "Virement",
  check: "Chèque",
  card: "Carte",
};

const PLAN_LABELS: Record<string, string> = { free: "Gratuit", standard: "Standard", business: "Business", vip: "VIP" };

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  const sp = await searchParams;
  const status = sp.status ?? "";

  let payments: AdminSubscriptionPayment[] = [];
  let orgs: { id: string; name: string; plan: string }[] = [];
  try {
    const [p, s] = await Promise.all([listSubscriptionPayments(ctx, { status: status || undefined }), listSubscriptions(ctx)]);
    if (p.ok) payments = p.data;
    if (s.ok) orgs = s.data.map((x) => ({ id: x.organizationId ?? "", name: x.orgName ?? "—", plan: x.plan }));
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Paiements</h1>
          <p className="text-muted-foreground">
            Suivi des paiements d&apos;abonnements (Super Admin).
          </p>
        </div>
        <RecordSubscriptionPaymentButton orgs={orgs} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Paiements ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminTableFilters
            basePath="/admin/paiements"
            statusValue={status}
            statusLabel="Statut"
            statusOptions={[
              { value: "pending", label: "En attente" },
              { value: "validated", label: "Validé" },
              { value: "refused", label: "Refusé" },
              { value: "canceled", label: "Annulé" },
            ]}
            placeholder="Rechercher…"
          />

          {payments.length === 0 ? (
            <EmptyState icon={CreditCard} title="Aucun paiement" description="Aucun paiement enregistré pour ces filtres." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Organisation</th>
                    <th className="pb-2 pr-4">Forfait</th>
                    <th className="pb-2 pr-4">Montant</th>
                    <th className="pb-2 pr-4">Moyen</th>
                    <th className="pb-2 pr-4">Référence</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const st = STATUS_LABELS[p.status] ?? { label: p.status, variant: "secondary" as const };
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{p.orgName ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{PLAN_LABELS[p.plan ?? ""] ?? p.plan ?? "—"}</td>
                        <td className="py-3 pr-4 tabular-nums">{p.amount.toLocaleString("fr-FR")} {p.currency}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.reference ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {p.paidAt ? p.paidAt.toLocaleDateString("fr-FR") : p.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3">
                          <PaymentStatusActions paymentId={p.id} status={p.status} />
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
    </div>
  );
}
