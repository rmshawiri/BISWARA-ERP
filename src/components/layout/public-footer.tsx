import Link from "next/link";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import { siteConfig } from "@/lib/config";

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3">
            <BiswaraLogo showSlogan />
            <p className="max-w-sm text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Produit</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#fonctionnalites" className="hover:text-foreground">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/#secteurs" className="hover:text-foreground">
                  Secteurs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Ressources</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {year} {siteConfig.name} — {siteConfig.author}
          </p>
          <div className="flex gap-4">
            <Link href="/conditions" className="hover:text-foreground">
              Conditions Générales
            </Link>
            <Link href="/confidentialite" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/mentions" className="hover:text-foreground">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
