import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import {
  listAccounts,
  listJournals,
  listJournalEntries,
  getBalance,
  getGrandLivre,
  getFinancialStatements,
  listFiscalYears,
} from "@/modules/accounting";
import type { ChartOfAccount, Journal, JournalEntry, FiscalYear } from "@/db/schema";
import { NewJournalEntryButton } from "@/components/feature/accounting/new-journal-entry-button";
import { AccountingReports } from "@/components/feature/accounting/accounting-reports";
import { ReverseEntryButton } from "@/components/feature/accounting/reverse-entry-button";
import { FiscalYearsManager } from "@/components/feature/accounting/fiscal-years-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PieChart } from "lucide-react";

export const metadata: Metadata = { title: "Comptabilité" };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Actif",
  liability: "Passif",
  equity: "Capitaux",
  revenue: "Produit",
  expense: "Charge",
};

export default async function ComptabilitePage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let accounts: ChartOfAccount[] = [];
  let journals: Journal[] = [];
  let entries: JournalEntry[] = [];
  let balance: { number: string; label: string; type: string | null; debit: number; credit: number; balance: number }[] = [];
  let grandLivre: { date: string | null; number: string; label: string; debit: number; credit: number }[] = [];
  let statements: { revenue: number; expense: number; net: number; assets: number; liabilities: number; equity: number } | null = null;
  let fiscalYears: FiscalYear[] = [];
  let dbReady = true;

  try {
    const [a, j, e, b, gl, st, fy] = await Promise.all([
      listAccounts(ctx),
      listJournals(ctx),
      listJournalEntries(ctx),
      getBalance(ctx),
      getGrandLivre(ctx),
      getFinancialStatements(ctx),
      listFiscalYears(ctx),
    ]);
    if (a.ok) accounts = a.data;
    if (j.ok) journals = j.data;
    if (e.ok) entries = e.data;
    if (b.ok) balance = b.data;
    if (gl.ok) grandLivre = gl.data;
    if (st.ok) statements = st.data;
    if (fy.ok) fiscalYears = fy.data;
  } catch {
    dbReady = false;
  }

  const accountById = new Map(accounts.map((x) => [x.id, x]));
  const journalById = new Map(journals.map((x) => [x.id, x]));
  const journalOptions = journals.map((x) => ({
    id: x.id,
    label: x.name,
  }));
  const currency = ctx.organization?.currency ?? "KMF";
  const accountOptions = accounts.map((x) => ({
    id: x.id,
    label: `${x.number ?? ""} ${x.label}`.trim(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comptabilité</h1>
          <p className="text-muted-foreground">
            Plan comptable, journaux et écritures.
          </p>
        </div>
        <NewJournalEntryButton journals={journalOptions} accounts={accountOptions} />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0004_sprint3.sql</code> dans Supabase pour activer
            ce module.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Écritures */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Écritures comptables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune écriture pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">N°</th>
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Libellé</th>
                      <th className="pb-2 pr-4">Journal</th>
                      <th className="pb-2 pr-4">Débit</th>
                      <th className="pb-2 pr-4">Crédit</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((en) => (
                      <tr key={en.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium tabular-nums">{en.number}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{en.date ?? "—"}</td>
                        <td className="py-3 pr-4">{en.label}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{journalById.get(en.journalId)?.name ?? "—"}</Badge>
                        </td>
                        <td className="py-3 pr-4 font-semibold tabular-nums">
                          {Number(en.totalDebit).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-3 font-semibold tabular-nums">
                          {Number(en.totalCredit).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-3">
                          <ReverseEntryButton id={en.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan comptable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              Plan comptable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun compte.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.label}</span>
                      {a.number && <Badge variant="secondary">{a.number}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[a.type ?? ""] ?? a.type ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountingReports balance={balance} grandLivre={grandLivre} statements={statements} currency={currency} />

      <FiscalYearsManager
        years={fiscalYears.map((y) => ({ id: y.id, startDate: y.startDate, endDate: y.endDate, status: y.status }))}
      />
    </div>
  );
}
