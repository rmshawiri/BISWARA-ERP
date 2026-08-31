import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "FAQ — BISWARA ERP",
  description: "Réponses aux questions fréquentes sur BISWARA ERP OS.",
};

const faqs = [
  {
    q: "Comment souscrire à BISWARA ?",
    a: "Choisissez un forfait puis cliquez sur « Souscrire ». WhatsApp s'ouvre avec un message pré-rempli. Vous recevez ensuite les modalités de paiement, puis votre organisation est créée.",
  },
  {
    q: "Quels sont les moyens de paiement disponibles ?",
    a: "Espèces, Mvola, Holo, Wakati, virement bancaire et carte bancaire, selon les conditions communiquées.",
  },
  {
    q: "Puis-je changer de forfait ?",
    a: "Oui. Le changement de forfait active ou désactive les modules correspondants, sans jamais supprimer vos données.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. BISWARA isole strictement chaque organisation, chiffre vos données et applique un contrôle rigoureux des permissions.",
  },
  {
    q: "BISWARA fonctionne-t-il sur mobile ?",
    a: "Oui. BISWARA est entièrement responsive et utilisable sur ordinateur, tablette et smartphone.",
  },
  {
    q: "Puis-je exporter mes données ?",
    a: "Oui, vous pouvez exporter vos données (PDF, Excel, CSV) et utiliser la sauvegarde depuis Paramètres.",
  },
];

export default function FaqPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(34,211,238,0.14),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="aurora-tag">FAQ</span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Questions <span className="aurora-gradient-text">fréquentes</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--aurora-muted)]">
            Tout ce qu'il faut savoir avant de vous lancer avec BISWARA.
          </p>
        </Reveal>
        <div className="mt-12">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </div>
  );
}
