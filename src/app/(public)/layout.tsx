import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { ScrollChrome } from "@/components/marketing/scroll-chrome";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ERP SaaS moderne pour entreprises africaines`,
  description:
    "Centralisez votre gestion, automatisez vos tâches et pilotez votre activité avec BISWARA ERP OS : CRM, Gestion Commerciale, Stock, Comptabilité, RH, Logistique et plus encore.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative flex min-h-screen flex-col bg-[#05060f] text-[var(--aurora-ink)] antialiased">
      <PublicNavbar />
      <ScrollChrome />
      <main className="relative flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
