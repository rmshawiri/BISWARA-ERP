"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export interface FaqItem {
  q: string;
  a: string;
}

const defaultFaqs: FaqItem[] = [
  {
    q: "Comment souscrire à BISWARA ?",
    a: "Choisissez un forfait puis cliquez sur « Souscrire ». WhatsApp s'ouvre automatiquement avec un message pré-rempli envoyé à notre équipe. Après règlement, votre abonnement est activé et vous pouvez compléter votre inscription.",
  },
  {
    q: "Quels sont les moyens de paiement disponibles ?",
    a: "BISWARA accepte les paiements via mobile money (Mvola, Holo, Wakati), les virements bancaires auprès de nos banques partenaires, et les espèces pour les règlements locaux.",
  },
  {
    q: "Puis-je changer de forfait à tout moment ?",
    a: "Oui. Vous pouvez passer à un forfait supérieur ou inférieur à tout moment. Vos données sont intégralement conservées et l'évolution se fait en toute transparence.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. BISWARA est multi-tenant avec une isolation stricte des organisations, un chiffrement et une gestion précise des permissions. Vos données sont hébergées de manière fiable et sauvegardées régulièrement.",
  },
  {
    q: "BISWARA fonctionne-t-il sur mobile ?",
    a: "Oui. BISWARA est entièrement responsive et accessible depuis un ordinateur, une tablette ou un smartphone, pour gérer votre activité où que vous soyez.",
  },
];

export function FaqAccordion({ faqs = defaultFaqs }: { faqs?: FaqItem[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="mx-auto w-full max-w-3xl space-y-3"
    >
      {faqs.map((f) => (
        <AccordionItem
          key={f.q}
          value={f.q}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-5 data-[state=open]:border-[rgba(124,92,255,0.35)]"
        >
          <AccordionTrigger className="py-5 text-left text-base font-semibold text-[var(--aurora-ink)] hover:no-underline">
            <span className="pr-4">{f.q}</span>
          </AccordionTrigger>
          <AccordionContent className="text-[var(--aurora-muted)]">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

