"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  suspendOrganizationAction,
  reactivateOrganizationAction,
  changePlanAction,
  activateSubscriptionAction,
} from "@/modules/platform/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLANS = [
  { value: "free", label: "Gratuit" },
  { value: "standard", label: "Standard" },
  { value: "business", label: "Business" },
  { value: "vip", label: "VIP" },
];

interface OrgActionsProps {
  orgId: string;
  status: string;
  plan: string;
}

export function OrgActions({ orgId, status, plan }: OrgActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const suspended = status === "suspended";

  function run(
    label: string,
    fn: () => Promise<{ ok: boolean; error?: string }>
  ) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error(res.error ?? "Action impossible.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {suspended ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run("Organisation réactivée", () =>
              reactivateOrganizationAction(orgId)
            )
          }
        >
          Réactiver
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Suspendre cette organisation ? Ses utilisateurs perdront l'accès.")) return;
            run("Organisation suspendue", () => suspendOrganizationAction(orgId));
          }}
        >
          Suspendre
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          run("Abonnement activé", () => activateSubscriptionAction(orgId))
        }
      >
        Activer abonnement
      </Button>

      <Select
        value={plan}
        onValueChange={(v) =>
          run("Forfait modifié", () => changePlanAction(orgId, v))
        }
        disabled={pending}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLANS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
