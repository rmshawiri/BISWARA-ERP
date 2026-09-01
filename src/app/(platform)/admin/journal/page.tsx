import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { listGlobalAudit } from "@/modules/platform";
import type { AuditLog } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Journal d'audit — Admin" };

const LEVEL_BADGE: Record<string, "success" | "secondary" | "destructive"> = {
  info: "success",
  warning: "secondary",
  critical: "destructive",
};

export default async function AdminJournalPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let rows: AuditLog[] = [];
  try {
    const res = await listGlobalAudit(ctx);
    if (res.ok) rows = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Journal d'audit (plateforme)</h1>
        <p className="text-muted-foreground">
          Toutes les actions enregistrées sur la plateforme (Super Admin).
        </p>
      </div>
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ScrollText className="h-4 w-4" />
          <CardTitle className="text-base">Événements ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun événement.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Utilisateur</th>
                    <th className="pb-2 pr-4">Module</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4">Niveau</th>
                    <th className="pb-2">Élément</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">{r.createdAt?.toLocaleString("fr-FR") ?? "—"}</td>
                      <td className="py-2.5 pr-4 font-medium">{r.userName ?? r.userId ?? "—"}</td>
                      <td className="py-2.5 pr-4">{r.module}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{r.action}</td>
                      <td className="py-2.5 pr-4"><Badge variant={LEVEL_BADGE[r.level] ?? "secondary"}>{r.level}</Badge></td>
                      <td className="py-2.5 text-muted-foreground">{r.entityType ? `${r.entityType}${r.entityId ? ` · ${r.entityId}` : ""}` : "—"}</td>
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
