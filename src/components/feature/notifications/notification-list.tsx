"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Check, Trash2 } from "lucide-react";
import { markReadAction, markAllReadAction, deleteNotificationAction } from "@/modules/notifications/actions";
import type { AppNotification } from "@/modules/notifications/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_PRIORITY = { label: "Normale", variant: "secondary" as const };
const PRIORITY: Record<string, { label: string; variant: "secondary" | "info" | "warning" | "default" }> = {
  low: { label: "Faible", variant: "secondary" },
  normal: { label: "Normale", variant: "secondary" },
  important: { label: "Importante", variant: "warning" },
  critical: { label: "Critique", variant: "info" },
};

export function NotificationList({ initial }: { initial: AppNotification[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      const res = await markReadAction(id);
      if (res.ok) {
        setItems((xs) => xs.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
      } else toast.error(res.error ?? "Erreur");
    });
  }

  function markAll() {
    startTransition(async () => {
      const res = await markAllReadAction();
      if (res.ok) {
        setItems((xs) => xs.map((x) => ({ ...x, isRead: true })));
      } else toast.error(res.error ?? "Erreur");
    });
  }

  function del(id: string) {
    startTransition(async () => {
      const res = await deleteNotificationAction(id);
      if (res.ok) {
        setItems((xs) => xs.filter((x) => x.id !== id));
        router.refresh();
      } else toast.error(res.error ?? "Erreur");
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <Bell className="h-10 w-10 opacity-40" />
        <p className="text-sm">Aucune notification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" disabled={pending} onClick={markAll}>
          <Check className="mr-1 h-3.5 w-3.5" />
          Tout marquer comme lu
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((n) => {
          const p = PRIORITY[n.priority] ?? DEFAULT_PRIORITY;
          return (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                n.isRead ? "bg-muted/30" : "bg-background"
              }`}
            >
              <div className="min-w-0 flex-1">
                {n.link ? (
                  <Link href={n.link} className="font-medium hover:underline" onClick={() => markRead(n.id)}>
                    {n.title}
                  </Link>
                ) : (
                  <p className="font-medium">{n.title}</p>
                )}
                {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant={p.variant}>{p.label}</Badge>
                  {n.module && <span className="text-xs text-muted-foreground">{n.module}</span>}
                  {!n.isRead && <Badge variant="default">Non lue</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.isRead && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(n.id)} aria-label="Marquer comme lu">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del(n.id)} aria-label="Supprimer">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
