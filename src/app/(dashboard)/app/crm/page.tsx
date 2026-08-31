import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listCustomers, listOpportunities } from "@/modules/crm";
import type { Customer, Opportunity } from "@/db/schema";
import { NewCustomerButton } from "@/components/feature/crm/new-customer-button";
import { OpportunityPipeline } from "@/components/feature/crm/opportunity-pipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "CRM" };

const typeLabel: Record<string, string> = {
  customer: "Client",
  prospect: "Prospect",
  partner: "Partenaire",
};

export default async function CrmPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let customers: Customer[] = [];
  let dbReady = true;
  let opportunities: Opportunity[] = [];
  try {
    const res = await listCustomers(ctx);
    if (res.ok) customers = res.data;
    const opp = await listOpportunities(ctx);
    if (opp.ok) opportunities = opp.data;
  } catch {
    dbReady = false;
  }

  const customerById = new Map(customers.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gérez vos prospects, clients et partenaires.
          </p>
        </div>
        <NewCustomerButton />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0003_business.sql</code> dans Supabase.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clients & prospects</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 opacity-40" />
              <p className="text-sm">Aucun contact pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Société</th>
                    <th className="pb-2 pr-4">Contact</th>
                    <th className="pb-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{c.lastname}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {c.company ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {c.email ?? c.phone ?? "—"}
                      </td>
                      <td className="py-3">
                        <Badge variant={c.type === "prospect" ? "warning" : "secondary"}>
                          {typeLabel[c.type] ?? c.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <OpportunityPipeline
        opportunities={opportunities.map((o) => ({
          id: o.id,
          title: o.title,
          value: Number(o.value),
          stage: o.stage,
          customerName: customerById.get(o.customerId)?.company ??
            customerById.get(o.customerId)?.lastname ??
            "—",
        }))}
        customers={customers.map((c) => ({
          id: c.id,
          label: c.company ? `${c.company} — ${c.lastname}` : c.lastname,
        }))}
        currency={ctx.organization?.currency ?? "KMF"}
      />
    </div>
  );
}
