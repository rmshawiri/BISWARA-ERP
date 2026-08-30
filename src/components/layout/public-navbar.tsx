import Link from "next/link";
import { Menu } from "lucide-react";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BISWARA - Accueil">
          <BiswaraLogo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#fonctionnalites" className="transition-colors hover:text-foreground">
            Fonctionnalités
          </Link>
          <Link href="/#secteurs" className="transition-colors hover:text-foreground">
            Secteurs
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            Tarifs
          </Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link href="/contact" className="transition-colors hover:text-foreground">
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Se connecter
            </Button>
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="accent" size="sm">
              Souscrire
            </Button>
          </a>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
