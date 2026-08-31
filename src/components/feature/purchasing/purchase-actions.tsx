"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, X, PackageCheck } from "lucide-react";
import { receivePurchaseAction, decidePurchaseAction } from "@/modules/purchasing/decision-actions";
import { Button } from "@/components/ui/button";

export function PurchaseActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) { toast.success(label); router.refresh(); }
      else toast.error(res.error ?? "Erreur");
    });
  }
  return (
    <div className="flex flex-wrap gap-1">
      {status === "pending" && (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("Approuvé", () => decidePurchaseAction(id, "approved"))}>
            <Check className="h-3.5 w-3.5" /> Approuver
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" disabled={pending} onClick={() => run("Rejeté", () => decidePurchaseAction(id, "rejected"))}>
            <X className="h-3.5 w-3.5" /> Rejeter
          </Button>
        </>
      )}
      {status === "validated" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("Réceptionné", () => receivePurchaseAction(id))}>
          <PackageCheck className="mr-1 h-3.5 w-3.5" /> Réceptionner
        </Button>
      )}
    </div>
  );
}
