"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  suspendOrganizationAction,
  reactivateOrganizationAction,
  changePlanAction,
  activateSubscriptionAction,
  setSubscriptionTrialAction,
  setSubscriptionDiscountAction,
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
  discountPercent?: number;
}

export function OrgActions({ orgId, status, plan, discountPercent = 0 }: OrgActionsProps) {
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

      <Select
        value="__trial__"
        onValueChange={(v) => {
          if (v !== "__trial__") {
            run("Essai prolongé", () =>
              setSubscriptionTrialAction(orgId, Number(v))
            );
          }
        }}
        disabled={pending}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Essai +j" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__trial__">Essai +j</SelectItem>
          <SelectItem value="7">+7 jours</SelectItem>
          <SelectItem value="14">+14 jours</SelectItem>
          <SelectItem value="30">+30 jours</SelectItem>
          <SelectItem value="60">+60 jours</SelectItem>
          <SelectItem value="90">+90 jours</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={`${discountPercent}`}
        onValueChange={(v) =>
          run("Remise appliquée", () =>
            setSubscriptionDiscountAction(orgId, Number(v))
          )
        }
        disabled={pending}
      >
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue placeholder="Remise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">0%</SelectItem>
          <SelectItem value="5">5%</SelectItem>
          <SelectItem value="10">10%</SelectItem>
          <SelectItem value="15">15%</SelectItem>
          <SelectItem value="20">20%</SelectItem>
          <SelectItem value="30">30%</SelectItem>
          <SelectItem value="50">50%</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
