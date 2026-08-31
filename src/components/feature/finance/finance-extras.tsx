"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Landmark, Wallet } from "lucide-react";
import { openCashSessionAction, closeCashSessionAction, createBudgetAction } from "@/modules/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

export function FinanceExtras({
  accounts,
  sessions,
  budgets,
  currency,
}: {
  accounts: { id: string; name: string; type: string }[];
  sessions: { id: string; accountId: string; status: string; openingBalance: number; theoreticalBalance: number; realBalance: number; gap: number }[];
  budgets: { id: string; name: string; category: string | null; planned: number }[];
  currency: string;
}) {
  const router = useRouter();
  const [accountId, setAccountId] = React.useState("");
  const [opening, setOpening] = React.useState("");
  const [bName, setBName] = React.useState("");
  const [bCategory, setBCategory] = React.useState("");
  const [bPlanned, setBPlanned] = React.useState("");

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    fn().then((res) => {
      if (res.ok) {
        toast.success(label);
        router.refresh();
      } else toast.error(res.error ?? "Erreur");
    });
  }

  const openSession = sessions.find((s) => s.status === "open");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Landmark className="h-4 w-4" />
          <CardTitle className="text-base">Sessions de caisse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {openSession ? (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Caisse ouverte</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>Fonds initial : <span className="font-semibold">{formatCurrency(openSession.openingBalance, currency)}</span></div>
                <div>Théorique : <span className="font-semibold">{formatCurrency(openSession.theoreticalBalance, currency)}</span></div>
                <div>Réel : <span className="font-semibold">{formatCurrency(openSession.realBalance, currency)}</span></div>
                <div>Écart : <span className="font-semibold">{formatCurrency(openSession.gap, currency)}</span></div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  const real = prompt("Fonds réel en caisse (KMF) ?");
                  if (real === null) return;
                  const inflows = Number(prompt("Encaissements (KMF) ?") ?? 0);
                  const outflows = Number(prompt("Décaissements (KMF) ?") ?? 0);
                  run("Caisse clôturée", () =>
                    closeCashSessionAction({
                      sessionId: openSession.id,
                      realBalance: Number(real) || 0,
                      inflows,
                      outflows,
                      justification: "Clôture manuelle",
                    })
                  );
                }}
              >
                Clôturer la caisse
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Compte de caisse</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fonds initial (KMF)</Label>
                <Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
              </div>
              <Button
                size="sm"
                disabled={!accountId}
                onClick={() => {
                  run("Caisse ouverte", () => openCashSessionAction({ accountId, openingBalance: Number(opening) || 0 }));
                  setOpening("");
                }}
              >
                Ouvrir la caisse
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Wallet className="h-4 w-4" />
          <CardTitle className="text-base">Budgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom</Label>
              <Input value={bName} onChange={(e) => setBName(e.target.value)} className="h-8 w-32" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Catégorie</Label>
              <Input value={bCategory} onChange={(e) => setBCategory(e.target.value)} className="h-8 w-28" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Montant</Label>
              <Input type="number" value={bPlanned} onChange={(e) => setBPlanned(e.target.value)} className="h-8 w-28" />
            </div>
            <Button
              size="sm"
              disabled={!bName.trim()}
              onClick={() => {
                run("Budget créé", () => createBudgetAction({ name: bName, category: bCategory || undefined, planned: Number(bPlanned) || 0 }));
                setBName(""); setBCategory(""); setBPlanned("");
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          {budgets.length === 0 && <p className="text-sm text-muted-foreground">Aucun budget.</p>}
          <ul className="space-y-1.5">
            {budgets.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{b.name}</span>
                <span className="flex items-center gap-2">
                  {b.category && <Badge variant="secondary">{b.category}</Badge>}
                  <span className="font-semibold tabular-nums">{formatCurrency(b.planned, currency)}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
