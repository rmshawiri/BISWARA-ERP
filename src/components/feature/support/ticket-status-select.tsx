"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateTicketStatusAction } from "@/modules/support";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { value: "open", label: "Ouvert" },
  { value: "in_progress", label: "En cours" },
  { value: "answered", label: "Répondu" },
  { value: "closed", label: "Clôturé" },
];

export function TicketStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      const res = await updateTicketStatusAction(id, value);
      if (res.ok) toast.success(`Statut : ${STATUSES.find((s) => s.value === value)?.label ?? value}`);
      else toast.error(res.error ?? "Action impossible.");
      router.refresh();
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
