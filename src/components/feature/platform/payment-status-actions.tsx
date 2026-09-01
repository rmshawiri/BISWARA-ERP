"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { updateSubscriptionPaymentStatusAction } from "@/modules/platform/actions";
import { Button } from "@/components/ui/button";

export function PaymentStatusActions({ paymentId, status }: { paymentId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run(newStatus: string, label: string) {
    startTransition(async () => {
      const res = await updateSubscriptionPaymentStatusAction(paymentId, newStatus);
      if (res.ok) toast.success(label);
      else toast.error(res.error ?? "Action impossible.");
      router.refresh();
    });
  }

  if (status === "validated") return null;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run("validated", "Paiement validé")}
      >
        <Check className="mr-1 h-3.5 w-3.5" /> Valider
      </Button>
      {status === "pending" && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => run("refused", "Paiement refusé")}
        >
          <X className="mr-1 h-3.5 w-3.5" /> Refuser
        </Button>
      )}
    </div>
  );
}
