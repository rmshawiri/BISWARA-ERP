import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Tarifs — BISWARA ERP",
  description:
    "Découvrez les forfaits BISWARA : Gratuit, Standard, Business et VIP. Souscrivez en un clic via WhatsApp.",
};

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Lueur d'en-tête */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(46,134,255,0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="aurora-tag">Tarifs</span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Des tarifs simples et{" "}
            <span className="aurora-gradient-text">transparents</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--aurora-muted)]">
            Choisissez le forfait adapté à votre activité. Changez de forfait à
            tout moment, vos données sont conservées.
          </p>
        </Reveal>
        <PricingCards className="mt-14" />
      </div>
    </div>
  );
}
