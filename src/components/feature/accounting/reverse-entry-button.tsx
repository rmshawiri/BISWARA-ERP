"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { reverseEntryAction } from "@/modules/accounting/admin-actions";
import { Button } from "@/components/ui/button";

export function ReverseEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Créer une contre-passation de cette écriture ?")) return;
        startTransition(async () => {
          const res = await reverseEntryAction(id);
          if (res.ok) { toast.success("Contre-passation créée"); router.refresh(); }
          else toast.error(res.error ?? "Erreur");
        });
      }}
      aria-label="Contre-passer"
    >
      <RotateCcw className="h-3.5 w-3.5" />
    </Button>
  );
}
