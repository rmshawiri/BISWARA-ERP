import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions Légales — BISWARA ERP" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Mentions Légales</h1>
      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Éditeur de la plateforme</h2>
          <p>
            BISWARA ERP OS est une plateforme logicielle éditee par{" "}
            <span className="font-medium text-foreground">MORA Shawiri</span>.
          </p>
          <ul className="mt-2 space-y-1">
            <li>Adresse : {siteConfig.address}</li>
            <li>Téléphone / WhatsApp : {siteConfig.phoneDisplay}</li>
            <li>E-mail : {siteConfig.email}</li>
            <li>Site Web : {siteConfig.site}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Directeur de la publication</h2>
          <p>
            La direction de la publication est assurée par{" "}
            <span className="font-medium text-foreground">MORA Shawiri</span>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Hébergement</h2>
          <p>
            La plateforme est déployée et exploitée sur l&apos;infrastructure
            cloud <span className="font-medium text-foreground">Vercel</span> (site internet) et{" "}
            <span className="font-medium text-foreground">Supabase</span> (base de données,
            authentification). Les données sont hébergées dans des centres de données
            sécurisés et conformes aux normes en vigueur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus de BISWARA ERP OS (marques, logos, textes,
            interfaces, codes) est protégé par le droit de la propriété intellectuelle
            et demeure la propriété exclusive de MORA Shawiri. Toute reproduction ou
            utilisation non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Contact</h2>
          <p>
            Pour toute question relative à la plateforme, vous pouvez nous joindre à
            l&apos;adresse{" "}
            <Link href={`mailto:${siteConfig.email}`} className="text-primary underline">
              {siteConfig.email}
            </Link>{" "}
            ou au {siteConfig.phoneDisplay}.
          </p>
        </section>
      </div>
    </div>
  );
}
