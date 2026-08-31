import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { listNotifications, type AppNotification } from "@/modules/notifications";
import { NotificationList } from "@/components/feature/notifications/notification-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  let items: AppNotification[] = [];
  try {
    const res = await listNotifications(ctx);
    if (res.ok) items = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Centre de notifications</h1>
        <p className="text-muted-foreground">
          Vos notifications BISWARA, e-mail et WhatsApp.
        </p>
      </div>
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Bell className="h-4 w-4" />
          <CardTitle className="text-base">Notifications ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList initial={items} />
        </CardContent>
      </Card>
    </div>
  );
}
