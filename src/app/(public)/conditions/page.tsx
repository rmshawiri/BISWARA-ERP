import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions Générales d'Utilisation — BISWARA ERP" };

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Conditions Générales d&apos;Utilisation</h1>
      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Objet</h2>
          <p>
            Les présentes conditions régissent l&apos;accès et l&apos;usage de la
            plateforme BISWARA ERP OS éditée par MORA Shawiri. En utilisant la
            plateforme, vous acceptez pleinement ces dispositions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Compte &amp; accès</h2>
          <p>
            La création d&apos;un compte implique l&apos;exactitude des informations
            fournies et la confidentialité des identifiants. Chaque organisation est
            responsable de la gestion des accès de ses utilisateurs et de la
            conformité de ses données.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Forfaits &amp; abonnements</h2>
          <p>
            BISWARA propose des forfaits (Gratuit, Standard, Business, VIP) associés à
            des modules et des limites. Les caractéristiques des forfaits peuvent
            évoluer ; tout changement vous sera communiqué et restera soumis au
            consentement de votre organisation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Usage licite &amp; sécurité</h2>
          <p>
            Vous vous engagez à utiliser la plateforme conformément aux lois en
            vigueur, à ne pas porter atteinte à la sécurité ou à l&apos;intégrité des
            données, et à ne pas tenter de contourner les mécanismes de contrôle
            d&apos;accès.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Responsabilité</h2>
          <p>
            MORA Shawiri met en œuvre des mesures techniques et organisationnelles
            adaptées pour garantir la disponibilité et la sécurité du service, sans
            pouvoir garantir une disponibilité ininterrompue. La responsabilité de la
            plateforme ne saurait être engagée en cas d&apos;usage inapproprié par
            l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Contact</h2>
          <p>
            Pour toute question relative aux présentes conditions, contactez-nous à{" "}
            {siteConfig.email} ou au {siteConfig.phoneDisplay} — {siteConfig.address}.
          </p>
        </section>
      </div>
    </div>
  );
}
