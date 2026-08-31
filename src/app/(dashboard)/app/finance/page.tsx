import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listAccounts, listTransactions, listCashSessions, listBudgets } from "@/modules/finance";
import type { Account, FinancialTransaction, CashSession, Budget } from "@/db/schema";
import { NewAccountButton } from "@/components/feature/finance/new-account-button";
import { NewTransactionButton } from "@/components/feature/finance/new-transaction-button";
import { FinanceExtras } from "@/components/feature/finance/finance-extras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Finance & Trésorerie" };

const TYPE_LABELS: Record<string, string> = {
  cash: "Caisse",
  bank: "Banque",
  mobile_money: "Mobile Money",
};

const DIRECTION_LABELS: Record<string, string> = {
  in: "Entrée",
  out: "Sortie",
  transfer: "Transfert",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  mvola: "Mvola",
  holo: "Holo",
  wakati: "Wakati",
  bank: "Banque",
  card: "Carte",
};

export default async function FinancePage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let accounts: Account[] = [];
  let transactions: FinancialTransaction[] = [];
  let cashSessions: CashSession[] = [];
  let budgets: Budget[] = [];
  let dbReady = true;

  try {
    const [a, t, cs, bg] = await Promise.all([
      listAccounts(ctx),
      listTransactions(ctx),
      listCashSessions(ctx),
      listBudgets(ctx),
    ]);
    if (a.ok) accounts = a.data;
    if (t.ok) transactions = t.data;
    if (cs.ok) cashSessions = cs.data;
    if (bg.ok) budgets = bg.data;
  } catch {
    dbReady = false;
  }

  const currency = ctx.organization?.currency ?? "KMF";
  const accountById = new Map(accounts.map((x) => [x.id, x]));
  const accountOptions = accounts.map((a) => ({
    id: a.id,
    label: a.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Finance &amp; Trésorerie</h1>
          <p className="text-muted-foreground">
            Comptes, opérations et trésorerie de l'organisation.
          </p>
        </div>
        <div className="flex gap-2">
          <NewTransactionButton accounts={accountOptions} />
          <NewAccountButton />
        </div>
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
        {/* Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="h-4 w-4" />
              Opérations récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune opération pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Compte</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Moyen</th>
                      <th className="pb-2 pr-4">Montant</th>
                      <th className="pb-2">Réf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">{t.date ?? "—"}</td>
                        <td className="py-3 pr-4 font-medium">
                          {accountById.get(t.accountId)?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={t.direction === "out" ? "warning" : t.direction === "transfer" ? "info" : "success"}>
                            {DIRECTION_LABELS[t.direction] ?? t.direction}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {METHOD_LABELS[t.method] ?? t.method}
                        </td>
                        <td
                          className={`py-3 pr-4 font-semibold tabular-nums ${
                            t.direction === "out" ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {t.direction === "out" ? "−" : "+"}
                          {formatCurrency(Number(t.amount), currency)}
                        </td>
                        <td className="py-3 text-muted-foreground">{t.reference ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comptes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Comptes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun compte configuré.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[a.type] ?? a.type}
                      </p>
                    </div>
                    <Badge variant="secondary">{formatCurrency(Number(a.openingBalance), a.currency)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <FinanceExtras
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
        sessions={cashSessions.map((s) => ({
          id: s.id,
          accountId: s.accountId,
          status: s.status,
          openingBalance: Number(s.openingBalance),
          theoreticalBalance: Number(s.theoreticalBalance),
          realBalance: Number(s.realBalance),
          gap: Number(s.gap),
        }))}
        budgets={budgets.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          planned: Number(b.planned),
        }))}
        currency={currency}
      />
    </div>
  );
}
