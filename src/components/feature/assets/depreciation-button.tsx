"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TrendingDown } from "lucide-react";
import { postDepreciationAction } from "@/modules/assets/actions";
import { Button } from "@/components/ui/button";

export function DepreciationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Poster l'écriture d'amortissement annuel de cet actif ?")) return;
        startTransition(async () => {
          const res = await postDepreciationAction(id);
          if (res.ok) { toast.success("Écriture d'amortissement postée"); router.refresh(); }
          else toast.error(res.error ?? "Erreur");
        });
      }}
    >
      <TrendingDown className="mr-1 h-3.5 w-3.5" />
      Amortir
    </Button>
  );
}
