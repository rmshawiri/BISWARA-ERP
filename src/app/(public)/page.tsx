import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  FileText,
  Package,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanCards } from "@/components/feature/pricing/plan-cards";
import { buildWhatsAppLink, demoMessage, subscribeMessage } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "BISWARA ERP OS — L'ERP SaaS moderne pour votre entreprise",
  description:
    "Centralisez votre gestion, automatisez vos tâches et prenez de meilleures décisions avec BISWARA : CRM, ventes, stock, comptabilité, RH, logistique et projets sur une plateforme unique.",
};

const features = [
  { icon: UserRound, title: "CRM", desc: "Prospects, clients, pipeline et opportunités commerciales." },
  { icon: ShoppingCart, title: "Gestion Commerciale", desc: "Devis, commandes, factures, paiements et créances." },
  { icon: Package, title: "Stock & Inventaire", desc: "Dépôts, mouvements, inventaires et alertes de stock." },
  { icon: Boxes, title: "Catalogue Produits & Services", desc: "Produits, services, tarifs, variantes et taxes." },
  { icon: Wallet, title: "Finance & Trésorerie", desc: "Caisses, banques, paiements, budgets et trésorerie." },
  { icon: FileText, title: "Comptabilité", desc: "Plan comptable, écritures, journaux et états financiers." },
  { icon: Building2, title: "Ressources Humaines", desc: "Employés, contrats, congés, présences et paie." },
  { icon: Truck, title: "Logistique & Transport", desc: "Livraisons, tournées, véhicules et chauffeurs." },
  { icon: BarChart3, title: "Gestion de Projets", desc: "Projets, tâches, Kanban, calendrier et équipes." },
];

const sectors = [
  "Commerce & Boutique",
  "Supermarché",
  "Restaurant & Hôtel",
  "Cabinet Médical & Dentaire",
  "Pharmacie",
  "Agence de Voyage",
  "Transport & Logistique",
  "Agriculture & Pêche",
  "BTP & Immobilier",
  "École & Formation",
  "Salon de Coiffure",
  "ONG & Association",
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-biswara-blue/5 to-background">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="outline" className="gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-biswara-green" />
                ERP SaaS sécurisé & multi-tenant
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-biswara-blue sm:text-5xl lg:text-6xl">
                Pilotez toute votre entreprise depuis une seule plateforme.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                BISWARA centralise votre gestion, automatise vos tâches et vous aide à
                prendre de meilleures décisions — CRM, ventes, stock, comptabilité, RH,
                logistique et projets dans une interface moderne et intuitive.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={buildWhatsAppLink(demoMessage())} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto">
                    Demander une démonstration
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/pricing">
                  <Button size="lg" variant="accent" className="w-full sm:w-auto">
                    Souscrire
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-2xl border bg-card p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Chiffre d'affaires
                    </p>
                    <p className="text-3xl font-bold">12 450 000 KMF</p>
                  </div>
                  <Badge variant="success">+18%</Badge>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: "Commandes", value: "148", color: "bg-biswara-blue" },
                    { label: "Factures réglées", value: "96%", color: "bg-biswara-green" },
                    { label: "Stock disponible", value: "1 204", color: "bg-biswara-gold" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AVANTAGES ================= */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Zap, title: "Rapide & moderne", desc: "Interface fluide et professionnelle, pensée pour l'usage quotidien." },
            { icon: ShieldCheck, title: "Sécurisé", desc: "Isolation stricte des organisations et permissions précises." },
            { icon: Wallet, title: "Adapté à l'Afrique", desc: "Devise KMF, mobile money (Mvola, Holo, Wakati) et secteurs locaux." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-biswara-blue p-2 text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS ================= */}
      <section id="fonctionnalites" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Un module pour chaque besoin de votre entreprise
          </h2>
          <p className="mt-4 text-muted-foreground">
            Activez uniquement les modules dont vous avez besoin, et faites-les évoluer avec votre activité.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="rounded-lg bg-biswara-blue/10 p-2.5 text-biswara-blue">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTEURS ================= */}
      <section id="secteurs" className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Conçu pour votre secteur d'activité
            </h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {sectors.map((s) => (
              <Badge key={s} variant="secondary" className="px-4 py-1.5 text-sm">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Comment ça marche ?</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { n: "1", t: "Choisissez un forfait", d: "Comparez les offres et sélectionnez celle qui correspond à votre besoin." },
            { n: "2", t: "Souscrivez via WhatsApp", d: "Un message pré-rempli s'ouvre. Recevez les modalités de paiement." },
            { n: "3", t: "Commencez à utiliser BISWARA", d: "Votre organisation est créée avec des données de démonstration." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-biswara-gold text-lg font-bold text-black">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TARIFS ================= */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Des tarifs simples et transparents</h2>
            <p className="mt-4 text-muted-foreground">
              Changez de forfait à tout moment. Vos données sont conservées.
            </p>
          </div>
          <PlanCards className="mt-12" />
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-biswara-blue p-10 text-center text-white sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Prêt à transformer la gestion de votre entreprise ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Rejoignez BISWARA et pilotez votre activité depuis une plateforme unique,
            moderne et sécurisée.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={buildWhatsAppLink(subscribeMessage("Business"))} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="accent">
                Souscrire
              </Button>
            </a>
            <a href={buildWhatsAppLink(demoMessage())} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Demander une démonstration
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
