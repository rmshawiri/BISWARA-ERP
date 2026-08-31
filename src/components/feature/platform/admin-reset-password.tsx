"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/modules/platform/actions";
import { Button } from "@/components/ui/button";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onClick() {
    if (!confirm("Réinitialiser le mot de passe de cet utilisateur ?"))
      return;
    startTransition(async () => {
      const res = await resetPasswordAction(userId);
      if (res.ok) {
        toast.success(`Mot de passe temporaire : ${res.data.temporaryPassword}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Réinitialisation impossible.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={onClick}>
      Réinitialiser mot de passe
    </Button>
  );
}
