"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import type { UserProfile, Organization } from "@/types";

interface AppShellProps {
  user: UserProfile;
  organization: Organization | null;
  children: React.ReactNode;
}

const navItems = [
  { href: "/app", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/app/crm", label: "CRM", icon: Users },
  { href: "/app/catalogue", label: "Catalogue", icon: Package },
  { href: "/app/ventes", label: "Ventes", icon: BarChart3 },
  { href: "/app/stock", label: "Stock", icon: Boxes },
  { href: "/app/parametres", label: "Paramètres", icon: Settings },
];

export function AppShell({ user, organization, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-biswara-blue text-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5 text-white">
          <BiswaraLogo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <p className="px-3 pb-1 text-xs text-white/50">Organisation</p>
          <p className="px-3 text-sm font-medium">
            {organization?.name ?? "Super Admin"}
          </p>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-biswara-blue text-white">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <BiswaraLogo />
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-semibold">Tableau de bord</p>
            </div>
          </div>

          <GlobalSearch className="hidden max-w-xs sm:block" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-biswara-gold" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                  aria-label="Profil"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? ""} />
                    <AvatarFallback className="bg-biswara-blue text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block">
                    {user.fullName}
                  </span>
                  <ChevronsUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/parametres">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/organisation">Organisation</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
