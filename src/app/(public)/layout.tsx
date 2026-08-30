import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
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
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
