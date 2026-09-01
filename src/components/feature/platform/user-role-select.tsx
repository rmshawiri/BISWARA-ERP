"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateUserRoleAction } from "@/modules/platform/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "Utilisateur" },
];

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function change(next: string) {
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, next);
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  return (
    <Select value={role} onValueChange={change} disabled={pending}>
      <SelectTrigger className="h-8 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
