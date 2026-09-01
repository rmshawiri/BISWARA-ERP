"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Coins, CreditCard, KeyRound, Webhook } from "lucide-react";
import { addCurrencyAction, setDefaultCurrencyAction, addPaymentMethodAction, togglePaymentMethodAction, createApiKeyAction, revokeApiKeyAction, addWebhookAction, removeWebhookAction } from "@/modules/advanced/actions";
import { WEBHOOK_EVENTS, WEBHOOK_METHODS } from "@/lib/webhook-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOOK_METHODS = WEBHOOK_METHODS;

export function AdvancedSettings({
  currencies,
  paymentMethods,
  apiKeys,
  webhooks,
  webhookDeliveries,
}: {
  currencies: { id: string; code: string; name: string | null; rateToKmf: number; isDefault: boolean }[];
  paymentMethods: { id: string; name: string; code: string | null; active: boolean }[];
  apiKeys: { id: string; label: string | null; keyText: string; active: boolean }[];
  webhooks: { id: string; event: string; url: string; name: string | null; method: string; active: boolean; lastDeliveryAt: string | null; deliveryCount: number }[];
  webhookDeliveries: { id: string; event: string; url: string; method: string; status: string; statusCode: number | null; statusText: string | null; durationMs: number | null; createdAt: string }[];
}) {
  const router = useRouter();
  const [hookOpen, setHookOpen] = React.useState(false);
  const [hookName, setHookName] = React.useState("");
  const [hookMethod, setHookMethod] = React.useState("POST");
  const [hookEvent, setHookEvent] = React.useState("all");
  const [hookUrl, setHookUrl] = React.useState("");
  const [hookSecret, setHookSecret] = React.useState("");
  const [hookPending, setHookPending] = React.useState(false);

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    fn().then((res) => { if (res.ok) { toast.success(label); router.refresh(); } else toast.error(res.error ?? "Erreur"); });
  }

  function addHook(e: React.FormEvent) {
    e.preventDefault();
    if (!hookUrl.trim()) return toast.error("URL requise.");
    setHookPending(true);
    addWebhookAction(hookEvent, hookUrl.trim(), hookName, hookMethod, hookSecret).then((res) => {
      setHookPending(false);
      if (res.ok) {
        toast.success("Webhook ajouté");
        setHookOpen(false);
        setHookName("");
        setHookUrl("");
        setHookSecret("");
        router.refresh();
      } else toast.error(res.error ?? "Erreur");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Devises */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0"><Coins className="h-4 w-4" /><CardTitle className="text-base">Devises</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" variant="outline" onClick={() => { const code = prompt("Code (ex : EUR)")?.trim().toUpperCase(); if (!code) return; const name = prompt("Nom (ex : Euro)") || ""; const rate = Number(prompt("Taux vers KMF (1 unité = X KMF)") ?? 1) || 1; run("Devise ajoutée", () => addCurrencyAction(code, name, rate)); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une devise
          </Button>
          {currencies.length === 0 && <p className="text-sm text-muted-foreground">Aucune devise configurée.</p>}
          {currencies.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{c.code} {c.name && `— ${c.name}`} · <span className="tabular-nums">{c.rateToKmf}</span> KMF</span>
              <div className="flex items-center gap-2">
                {c.isDefault && <Badge variant="secondary">Défaut</Badge>}
                {!c.isDefault && <Button size="sm" variant="outline" onClick={() => run("Devise par défaut", () => setDefaultCurrencyAction(c.id))}>Définir</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modes de paiement */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0"><CreditCard className="h-4 w-4" /><CardTitle className="text-base">Modes de paiement</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" variant="outline" onClick={() => { const name = prompt("Nom (ex : Mvola)")?.trim(); if (!name) return; const code = prompt("Code (ex : mvola)")?.trim() || name.toLowerCase(); run("Mode ajouté", () => addPaymentMethodAction(name, code)); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un mode
          </Button>
          {paymentMethods.length === 0 && <p className="text-sm text-muted-foreground">Aucun mode configuré.</p>}
          {paymentMethods.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{m.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={m.active ? "success" : "secondary"}>{m.active ? "Actif" : "Inactif"}</Badge>
                <Switch checked={m.active} onCheckedChange={(v) => run(m.active ? "Mode désactivé" : "Mode activé", () => togglePaymentMethodAction(m.id, v))} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Clés API */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0"><KeyRound className="h-4 w-4" /><CardTitle className="text-base">Clés API</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" variant="outline" onClick={() => { const label = prompt("Libellé (ex : Intégration)")?.trim() || "Clé"; const res = createApiKeyAction(label); res.then((r) => { if (r.ok) { toast.success("Clé générée (copiez-la maintenant)"); router.refresh(); } else toast.error(r.error ?? "Erreur"); }); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Générer une clé
          </Button>
          {apiKeys.map((k) => (
            <div key={k.id} className="rounded-lg border p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{k.label ?? "Clé"}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={k.active ? "success" : "secondary"}>{k.active ? "Active" : "Révoquée"}</Badge>
                  {k.active && <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => run("Clé révoquée", () => revokeApiKeyAction(k.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
              <code className="block truncate text-xs text-muted-foreground">{k.keyText}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0"><Webhook className="h-4 w-4" /><CardTitle className="text-base">Webhooks</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Dialog open={hookOpen} onOpenChange={setHookOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un webhook</DialogTitle>
              </DialogHeader>
              <form onSubmit={addHook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={hookName} onChange={(e) => setHookName(e.target.value)} placeholder="Ex : Sync ERP / CRM" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Événement</Label>
                    <Select value={hookEvent} onValueChange={setHookEvent}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_EVENTS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Méthode HTTP</Label>
                    <Select value={hookMethod} onValueChange={setHookMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HOOK_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL cible (https://…)</Label>
                  <Input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://externe.app/webhooks" required />
                </div>
                <div className="space-y-2">
                  <Label>Clé de sécurité (optionnelle)</Label>
                  <Input value={hookSecret} onChange={(e) => setHookSecret(e.target.value)} placeholder="Secret HMAC" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setHookOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={hookPending}>{hookPending ? "Ajout…" : "Créer"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {webhooks.length === 0 && <p className="text-sm text-muted-foreground">Aucun webhook.</p>}
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{w.name || `${w.event} · ${w.method}`}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {w.event === "all" ? "Tous les événements" : w.event} · {w.method} · {w.url}
                </p>
                <p className="text-xs text-muted-foreground">
                  {w.deliveryCount} livraison(s){w.lastDeliveryAt ? ` · ${new Date(w.lastDeliveryAt).toLocaleString("fr-FR")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={w.active ? "success" : "secondary"}>{w.active ? "Actif" : "Inactif"}</Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => run("Webhook supprimé", () => removeWebhookAction(w.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Journal des livraisons Webhooks */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Webhook className="h-4 w-4" />
          <CardTitle className="text-base">Journal des livraisons Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {webhookDeliveries.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune livraison enregistrée.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left uppercase text-muted-foreground">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Événement</th>
                  <th className="py-2 pr-4">Méthode</th>
                  <th className="py-2 pr-4">URL</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2">Durée</th>
                </tr>
              </thead>
              <tbody>
                {webhookDeliveries.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2 pr-4">{d.event}</td>
                    <td className="py-2 pr-4">{d.method}</td>
                    <td className="py-2 pr-4 max-w-[220px] truncate">{d.url}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={d.status === "success" ? "success" : "destructive"}>{d.status}</Badge>
                    </td>
                    <td className="py-2 pr-4">{d.statusCode ?? "—"}</td>
                    <td className="py-2">{d.durationMs != null ? `${d.durationMs} ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {webhookDeliveries.some((d) => d.statusText) && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer">Voir les réponses/erreurs</summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/40 p-2 text-xs">
                {webhookDeliveries.filter((d) => d.statusText).map((d) => `${d.event} [${d.statusCode ?? "—"}]: ${d.statusText}`).join("\n")}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
