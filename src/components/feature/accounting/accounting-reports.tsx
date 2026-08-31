"use client";

import * as React from "react";
import { BookOpen, ListTree, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function AccountingReports({
  balance,
  grandLivre,
  statements,
  currency,
}: {
  balance: { number: string; label: string; type: string | null; debit: number; credit: number; balance: number }[];
  grandLivre: { date: string | null; number: string; label: string; debit: number; credit: number }[];
  statements: { revenue: number; expense: number; net: number; assets: number; liabilities: number; equity: number } | null;
  currency: string;
}) {
  const [tab, setTab] = React.useState<"balance" | "livre" | "etats">("balance");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { key: "balance" as const, label: "Balance générale", icon: ListTree },
          { key: "livre" as const, label: "Grand Livre", icon: BookOpen },
          { key: "etats" as const, label: "États financiers", icon: PieChart },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "border-primary bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "balance" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Balance générale</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-4">Compte</th><th className="pb-2 pr-4">Libellé</th>
                  <th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Débit</th>
                  <th className="pb-2 pr-4">Crédit</th><th className="pb-2">Solde</th>
                </tr>
              </thead>
              <tbody>
                {balance.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Aucune écriture.</td></tr>}
                {balance.map((b) => (
                  <tr key={b.number} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium tabular-nums">{b.number}</td>
                    <td className="py-2 pr-4">{b.label}</td>
                    <td className="py-2 pr-4"><Badge variant="secondary">{b.type ?? "—"}</Badge></td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(b.debit, currency)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(b.credit, currency)}</td>
                    <td className="py-2 font-semibold tabular-nums">{formatCurrency(b.balance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "livre" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Grand Livre</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-4">Date</th><th className="pb-2 pr-4">N°</th>
                  <th className="pb-2 pr-4">Libellé</th><th className="pb-2 pr-4">Débit</th><th className="pb-2">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {grandLivre.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aucune ligne.</td></tr>}
                {grandLivre.map((g, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{g.date ?? "—"}</td>
                    <td className="py-2 pr-4">{g.number}</td>
                    <td className="py-2 pr-4">{g.label}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(g.debit, currency)}</td>
                    <td className="py-2 tabular-nums">{formatCurrency(g.credit, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "etats" && statements && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Compte de résultat</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Produits</span><span className="font-semibold tabular-nums">{formatCurrency(statements.revenue, currency)}</span></div>
              <div className="flex justify-between"><span>Charges</span><span className="font-semibold tabular-nums">{formatCurrency(statements.expense, currency)}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold"><span>Résultat net</span><span className="tabular-nums">{formatCurrency(statements.net, currency)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Bilan</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Actif</span><span className="font-semibold tabular-nums">{formatCurrency(statements.assets, currency)}</span></div>
              <div className="flex justify-between"><span>Passif</span><span className="font-semibold tabular-nums">{formatCurrency(statements.liabilities, currency)}</span></div>
              <div className="flex justify-between"><span>Capitaux propres</span><span className="font-semibold tabular-nums">{formatCurrency(statements.equity, currency)}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold"><span>Équilibre</span><span className="tabular-nums">{formatCurrency(statements.assets - (statements.liabilities + statements.equity), currency)}</span></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
