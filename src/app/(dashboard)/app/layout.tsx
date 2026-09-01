import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { getAllowedModules } from "@/modules/navigation";
import { countUnread } from "@/modules/notifications";
import { isMaintenanceActive } from "@/server/maintenance";
import { AppShell } from "@/components/layout/app-shell";

// Routes protégées par session → toujours dynamiques.
export const dynamic = "force-dynamic";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthzContext();
  if (!ctx) redirect("/login");
  if (ctx.superAdmin) redirect("/admin");

  // Mode maintenance : l'espace de travail est suspendu.
  if (await isMaintenanceActive()) redirect("/maintenance");

  const [allowedModules, unreadRes] = await Promise.all([
    getAllowedModules(ctx),
    countUnread(ctx),
  ]);

  return (
    <AppShell
      user={ctx.user}
      organization={ctx.organization}
      allowedModules={allowedModules}
      unreadNotifications={unreadRes.ok ? unreadRes.data : 0}
      canAdmin={ctx.user.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
