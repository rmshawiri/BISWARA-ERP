import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthzContext();
  if (!ctx) redirect("/login");
  if (ctx.superAdmin) redirect("/admin");

  return (
    <AppShell user={ctx.user} organization={ctx.organization}>
      {children}
    </AppShell>
  );
}
