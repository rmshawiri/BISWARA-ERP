import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ — BISWARA ERP",
  description: "Réponses aux questions fréquentes sur BISWARA ERP OS.",
};

const faqs = [
  {
    q: "Comment souscrire à BISWARA ?",
    a: "Cliquez sur le bouton « Souscrire » d'un forfait : WhatsApp s'ouvre avec un message pré-rempli. Vous recevez ensuite les modalités de paiement, puis votre organisation est créée.",
  },
  {
    q: "Quels sont les moyens de paiement ?",
    a: "Espèces, Mvola, Holo, Wakati, chèque, virement bancaire et carte bancaire, selon les conditions communiquées.",
  },
  {
    q: "Puis-je changer de forfait ?",
    a: "Oui. Le changement de forfait active ou désactive les modules correspondants, sans jamais supprimer vos données.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. BISWARA isole strictement chaque organisation et applique un contrôle rigoureux des permissions.",
  },
  {
    q: "BISWARA fonctionne-t-il sur mobile ?",
    a: "Oui. BISWARA est responsive et utilisable sur ordinateur, tablette et smartphone.",
  },
  {
    q: "Puis-je exporter mes données ?",
    a: "Oui, vous pouvez exporter vos données (PDF, Excel, CSV) et utiliser la sauvegarde depuis Paramètres.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Questions fréquentes
        </h1>
      </div>
      <Accordion type="single" collapsible className="mt-12">
        {faqs.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
