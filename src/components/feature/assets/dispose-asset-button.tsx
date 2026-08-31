"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { disposeAssetAction } from "@/modules/assets/actions";
import { Button } from "@/components/ui/button";

export function DisposeAssetButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  function onClick() {
    const reason = prompt("Motif de la sortie (vente, réforme, perte, vol, don) ?");
    if (!reason) return;
    startTransition(async () => {
      const res = await disposeAssetAction(id, reason);
      if (res.ok) {
        toast.success("Actif sorti.");
        router.refresh();
      } else toast.error(res.error ?? "Erreur");
    });
  }
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={onClick}>
      <Archive className="mr-1 h-3.5 w-3.5" />
      Sortir
    </Button>
  );
}
