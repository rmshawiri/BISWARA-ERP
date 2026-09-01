"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { createJournalEntryAction } from "@/modules/accounting/actions";
import { Button } from "@/components/ui/button";
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

interface Line {
  key: string;
  account: string;
  label: string;
  debit: string;
  credit: string;
}

const emptyLine = (): Line => ({
  key: crypto.randomUUID(),
  account: "",
  label: "",
  debit: "",
  credit: "",
});

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function NewJournalEntryButton({
  journals,
  accounts,
}: {
  journals: { id: string; label: string }[];
  accounts: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [journalId, setJournalId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([emptyLine()]);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const totals = React.useMemo(() => {
    const d = lines.reduce((s, l) => s + num(l.debit), 0);
    const c = lines.reduce((s, l) => s + num(l.credit), 0);
    return { debit: d, credit: c, balanced: Math.abs(d - c) < 0.01 };
  }, [lines]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!journalId) {
      toast.error("Sélectionnez un journal.");
      return;
    }
    const cleaned = lines.filter((l) => l.account && (num(l.debit) > 0 || num(l.credit) > 0));
    if (cleaned.length === 0) {
      toast.error("Ajoutez au moins une ligne valide.");
      return;
    }
    if (!totals.balanced) {
      toast.error("L'écriture doit être équilibrée (Débit = Crédit).");
      return;
    }
    setLoading(true);
    const res = await createJournalEntryAction({
      journalId,
      date,
      label: label.trim(),
      lines: cleaned.map((l) => ({
        account: l.account,
        label: l.label.trim() || "Ligne",
        debit: num(l.debit),
        credit: num(l.credit),
      })),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Écriture enregistrée");
      setOpen(false);
      setLines([emptyLine()]);
      setJournalId("");
      setLabel("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <BookOpen className="h-4 w-4" />
          Nouvelle écriture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une écriture comptable</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Journal</Label>
              <Select value={journalId} onValueChange={setJournalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un journal" />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Vente au comptant" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Lignes</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {lines.map((l, i) => (
              <div key={l.key} className="grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_90px_90px_32px]">
                <div className="space-y-2">
                  <Label className="text-xs">Compte</Label>
                  <Select value={l.account} onValueChange={(v) => updateLine(l.key, { account: v })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Libellé</Label>
                  <Input className="h-8 text-xs" value={l.label} onChange={(e) => updateLine(l.key, { label: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Débit</Label>
                  <Input className="h-8 text-xs" type="number" min="0" step="0.01" value={l.debit} onChange={(e) => updateLine(l.key, { debit: e.target.value, credit: "" })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Crédit</Label>
                  <Input className="h-8 text-xs" type="number" min="0" step="0.01" value={l.credit} onChange={(e) => updateLine(l.key, { credit: e.target.value, debit: "" })} />
                </div>
                <button type="button" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="mt-6 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30" aria-label={`Supprimer la ligne ${i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total débit</span>
              <span className="font-semibold tabular-nums">{totals.debit.toLocaleString("fr-FR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total crédit</span>
              <span className="font-semibold tabular-nums">{totals.credit.toLocaleString("fr-FR")}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span>Équilibre</span>
              <span className={`font-bold ${totals.balanced ? "text-biswara-green-400" : "text-red-400"}`}>
                {totals.balanced ? "✓ Équilibré" : "✗ Non équilibré"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
