"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  CalendarDays,
  ChevronsUpDown,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  MapPin,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
  LifeBuoy,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { logAuthEvent } from "@/server/auth-audit";
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
import { navLabel } from "@/lib/i18n";
import type { UserProfile, Organization } from "@/types";

interface AppShellProps {
  user: UserProfile;
  organization: Organization | null;
  allowedModules: string[];
  unreadNotifications?: number;
  canAdmin?: boolean;
  children: React.ReactNode;
}

// Catalogue de navigation : module -> entrée de menu.
const NAV_CATALOG: Record<
  string,
  { href: string; label: string; icon: typeof Users }
> = {
  crm: { href: "/app/crm", label: "CRM", icon: Users },
  catalog: { href: "/app/catalogue", label: "Catalogue", icon: Package },
  purchases: { href: "/app/achats", label: "Achats", icon: Truck },
  sales: { href: "/app/ventes", label: "Ventes", icon: BarChart3 },
  stock: { href: "/app/stock", label: "Stock", icon: Boxes },
  finance: { href: "/app/finance", label: "Finance", icon: Wallet },
  accounting: { href: "/app/comptabilite", label: "Comptabilité", icon: BookOpen },
  assets: { href: "/app/immobilisations", label: "Immobilisations", icon: Landmark },
  hr: { href: "/app/rh", label: "RH", icon: CalendarDays },
  projects: { href: "/app/projets", label: "Projets", icon: FolderKanban },
  logistics: { href: "/app/logistique", label: "Logistique", icon: MapPin },
};

const DASHBOARD_ITEM = { href: "/app", label: "Tableau de bord", icon: LayoutDashboard };
const SETTINGS_ITEM = { href: "/app/parametres", label: "Paramètres", icon: Settings };
const ADMIN_ITEM = { href: "/app/administration", label: "Administration", icon: ShieldCheck };
const AUDIT_ITEM = { href: "/app/audit", label: "Journal d'audit", icon: ScrollText };
const RAPPORTS_ITEM = { href: "/app/rapports", label: "Rapports", icon: BarChart3 };
const PORTAIL_ITEM = { href: "/app/portail", label: "Mon espace", icon: UserRound };
const SUPPORT_ITEM = { href: "/app/support", label: "Support", icon: LifeBuoy };

export function AppShell({ user, organization, allowedModules, unreadNotifications = 0, canAdmin = false, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { ...DASHBOARD_ITEM, label: navLabel("dashboard") },
    ...allowedModules
      .map((m) => {
        const c = NAV_CATALOG[m];
        return c ? { ...c, label: navLabel(m) } : null;
      })
      .filter((x): x is { href: string; label: string; icon: typeof Users } => Boolean(x)),
    { ...RAPPORTS_ITEM, label: navLabel("rapports") },
    { ...PORTAIL_ITEM, label: navLabel("portail") },
    ...(canAdmin
      ? [
          { ...ADMIN_ITEM, label: navLabel("administration") },
          { ...AUDIT_ITEM, label: navLabel("audit") },
        ]
      : []),
    { ...SETTINGS_ITEM, label: navLabel("settings") },
    { ...SUPPORT_ITEM, label: "Support" },
  ];

  async function signOut() {
    const supabase = createClient();
    logAuthEvent("logout");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const NavLink = ({ item, onNavigate }: { item: (typeof navItems)[number]; onNavigate?: () => void }) => {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
          active
            ? "bg-white/12 text-white shadow-inner"
            : "text-white/65 hover:bg-white/6 hover:text-white"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-biswara-gold-400" />
        )}
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden bg-gradient-to-b from-[#0B1C42] via-[#0F2E5E] to-[#05060f] text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_50%_-10%,rgba(46,134,255,0.4),transparent),radial-gradient(50%_40%_at_100%_100%,rgba(34,211,238,0.18),transparent)]" />
        <div className="relative flex h-16 items-center border-b border-white/8 px-5">
          <BiswaraLogo variant="dark" />
        </div>
        <nav className="relative flex-1 space-y-1 p-3.5">
          <p className="px-3.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
            Menu
          </p>
          {navItems.map((it) => (
            <NavLink key={it.href} item={it} />
          ))}
        </nav>
        <div className="relative border-t border-white/8 p-3.5">
          <div className="flex items-center gap-3 rounded-xl bg-white/6 p-2.5">
            <Avatar className="h-9 w-9 ring-2 ring-white/15">
              <AvatarImage src={user.avatarUrl ?? ""} />
              <AvatarFallback className="bg-brand-gradient text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {organization?.name ?? "Super Admin"}
              </p>
              <p className="truncate text-xs text-white/45">
                {user.fullName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-[#0B1C42] via-[#0F2E5E] to-[#05060f] text-white">
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
              <BiswaraLogo variant="dark" />
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer" className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3.5">
              {navItems.map((it) => (
                <NavLink key={it.href} item={it} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <GlobalSearch className="hidden max-w-md flex-1 md:flex" />

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/app/notifications" className="relative" aria-label="Notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-[18px] w-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-biswara-gold-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Thème"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <span className="text-base leading-none">{resolvedTheme === "dark" ? "☀" : "☾"}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-full px-1.5" aria-label="Profil">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={user.avatarUrl ?? ""} />
                    <AvatarFallback className="bg-brand-gradient text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronsUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user.fullName}</p>
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
