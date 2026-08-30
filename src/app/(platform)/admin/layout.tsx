import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthzContext } from "@/server/auth";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { BiswaraLogo } from "@/components/brand/biswara-logo";

const adminNav = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/organisations", label: "Organisations", icon: Building2 },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-biswara-blue text-white lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5 text-white">
          <BiswaraLogo variant="dark" />
          <span className="ml-2 rounded bg-biswara-gold-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-biswara-gold text-black">
              {ctx.user.fullName[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {ctx.user.fullName}
              </p>
              <p className="text-xs text-white/50">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
          <p className="text-sm font-semibold">Administration Plateforme</p>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
