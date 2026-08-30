import type { Metadata } from "next";
import { PlanCards } from "@/components/feature/pricing/plan-cards";

export const metadata: Metadata = {
  title: "Tarifs — BISWARA ERP",
  description:
    "Découvrez les forfaits BISWARA : Gratuit, Standard, Business et VIP. Souscrivez en un clic via WhatsApp.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Des tarifs simples et transparents
        </h1>
        <p className="mt-4 text-muted-foreground">
          Choisissez le forfait adapté à votre activité. Changez de forfait à
          tout moment, vos données sont conservées.
        </p>
      </div>
      <PlanCards className="mt-12" />
    </div>
  );
}
