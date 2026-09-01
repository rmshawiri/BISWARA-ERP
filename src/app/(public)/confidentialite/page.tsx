import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Politique de Confidentialité — BISWARA ERP" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Principes</h2>
          <p>
            La protection de vos données est au cœur de BISWARA ERP OS. Chaque
            organisation dispose d&apos;un espace totalement isolé, et les accès sont
            strictement contrôlés par des permissions fines (rôle &amp; module).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Données collectées</h2>
          <p>
            Nous collectons uniquement les données nécessaires au fonctionnement de la
            plateforme : identité (nom, prénom, e-mail, téléphone), identifiants de
            connexion, paramètres de votre organisation et fichiers produits par votre
            activité. Aucune donnée n&apos;est revendue à des tiers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Confidentialité &amp; chiffrement</h2>
          <p>
            Les données sensibles sont chiffrées, et les secrets (clés Supabase,
            tokens) ne sont jamais exposés au navigateur. La plateforme applique une
            politique de moindre privilège et journalise les actions sensibles dans un
            registre d&apos;audit.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Durée de conservation</h2>
          <p>
            Vos données sont conservées pendant la durée de votre abonnement, puis
            supprimées ou anonymisées à l&apos;issue, conformément aux obligations
            légales applicables.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Vos droits</h2>
          <p>
            Conformément à la réglementation sur la protection des données, vous
            disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et
            de suppression de vos données. Pour exercer ces droits, contactez-nous à{" "}
            <Link href={`mailto:${siteConfig.email}`} className="text-primary underline">
              {siteConfig.email}
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Contact</h2>
          <p>
            Responsable de la protection des données :{" "}
            <span className="font-medium text-foreground">MORA Shawiri</span> —{" "}
            {siteConfig.address}. Pour toute question, écrivez-nous à{" "}
            {siteConfig.email}.
          </p>
        </section>
      </div>
    </div>
  );
}
