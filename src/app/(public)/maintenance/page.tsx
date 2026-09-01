import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Maintenance — BISWARA ERP" };

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070813] px-4">
      <div className="max-w-md text-center text-white">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <Wrench className="h-8 w-8 text-biswara-gold-400" />
        </div>
        <h1 className="text-3xl font-bold">Site en maintenance</h1>
        <p className="mt-4 text-white/70">
          BISWARA est momentanément indisponible pour maintenance. Nous
          revenons très vite. Merci de votre patience.
        </p>
        <p className="mt-6 text-sm text-white/50">
          Pour toute urgence : {siteConfig.email} · {siteConfig.phoneDisplay}
        </p>
        <div className="mt-6">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
