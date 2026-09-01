import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Check,
  ClipboardList,
  FileText,
  Globe,
  Landmark,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { TiltCard } from "@/components/motion/tilt-card";
import { buildWhatsAppLink, demoMessage, subscribeMessage } from "@/lib/whatsapp";
import { PLANS_LIST } from "@/lib/plans";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "BISWARA ERP OS — L'ERP SaaS moderne pour votre entreprise",
  description:
    "Centralisez votre gestion, automatisez vos tâches et prenez de meilleures décisions avec BISWARA : CRM, ventes, stock, comptabilité, RH, logistique et projets sur une plateforme unique, sécurisée et adaptée à l'Afrique.",
};

const advantages = [
  {
    icon: Zap,
    title: "Rapide & moderne",
    desc: "Une interface fluide et professionnelle, pensée pour l'usage quotidien et la productivité de vos équipes.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurisé & multi-tenant",
    desc: "Isolation stricte des organisations, permissions précises et chiffrement de vos données sensibles.",
  },
  {
    icon: Smartphone,
    title: "Adapté à l'Afrique",
    desc: "Devise KMF, mobile money (Mvola, Holo, Wakati) et secteurs locaux pris en charge nativement.",
  },
];

const modules = [
  { icon: Users, title: "CRM", tag: "Prospects · Pipeline · Opportunités", desc: "Gérez vos contacts, votre pipeline et vos opportunités commerciales de bout en bout." },
  { icon: ShoppingCart, title: "Gestion Commerciale", tag: "Devis · Commandes · Factures", desc: "De la prospection à l'encaissement, pilotez tout votre cycle de vente." },
  { icon: Boxes, title: "Catalogue Produits & Services", tag: "Tarifs · Variantes · Taxes", desc: "Produits, services, tarifs et taxes structurés et prêts à vendre." },
  { icon: PackageSearch, title: "Stock & Inventaire", tag: "Dépôts · Mouvements · Alertes", desc: "Suivez vos quantités, mouvements et inventaires avec des alertes automatiques." },
  { icon: ShoppingBag, title: "Achats & Fournisseurs", tag: "Commandes · Réceptions · Factures", desc: "Centralisez vos achats et la relation avec vos fournisseurs." },
  { icon: Wallet, title: "Finance & Trésorerie", tag: "Caisses · Banques · Budgets", desc: "Caisses, banques, paiements et trésorerie en temps réel." },
  { icon: FileText, title: "Comptabilité", tag: "Écritures · Journaux · États", desc: "Plan comptable, écritures et états financiers conformes." },
  { icon: Landmark, title: "Immobilisations", tag: "Amortissements · Registres", desc: "Suivez vos actifs, amortissements et registres d'immobilisations." },
  { icon: BadgeCheck, title: "Portail Employé", tag: "Self-service · Congés · Paie", desc: "Un espace personnel pour vos employés : congés, documents et paie." },
  { icon: UserRound, title: "Ressources Humaines", tag: "Contrats · Présences · Paie", desc: "Gérez la vie RH de votre entreprise : contrats, présences et paie." },
  { icon: Truck, title: "Logistique & Transport", tag: "Livraisons · Tournées · Véhicules", desc: "Organisez vos livraisons, tournées et flotte de véhicules." },
  { icon: ClipboardList, title: "Gestion de Projets", tag: "Tâches · Kanban · Équipes", desc: "Projets, tâches, Kanban et calendrier pour coordonner vos équipes." },
];

const sectors = [
  "Commerce & Boutique",
  "Supermarché",
  "Restaurant & Hôtel",
  "Cabinet Médical",
  "Cabinet Dentaire",
  "Pharmacie",
  "Agence de Voyage",
  "Transport & Logistique",
  "Agriculture & Pêche",
  "BTP & Immobilier",
  "École & Formation",
  "Salon de Coiffure",
  "ONG & Association",
];

const steps = [
  { n: "01", title: "Choisissez un forfait", desc: "Comparez les offres et sélectionnez celle qui correspond à votre besoin." },
  { n: "02", title: "Souscrivez via WhatsApp", desc: "Un message pré-rempli s'ouvre. Recevez les modalités de paiement." },
  { n: "03", title: "Réglez & confirmez", desc: "Effectuez votre règlement (mobile money ou bancaire) et envoyez la référence." },
  { n: "04", title: "Démarrez avec BISWARA", desc: "Votre organisation est activée et prête, avec des données de démonstration." },
];

const testimonials = [
  {
    quote:
      "BISWARA a transformé notre gestion. Le CRM et la facturation sont intuitifs, et le passage au mobile money nous a fait gagner un temps précieux.",
    name: "Amina M.",
    role: "Gérante, Boutique — Moroni",
    initials: "AM",
    grad: "from-[#2E86FF] to-[#22d3ee]",
    metric: "Temps de gestion",
    metricValue: "−40%",
  },
  {
    quote:
      "Enfin un ERP pensé pour nos réalités. La comptabilité est conforme et l'équipe répond rapidement via WhatsApp. Un vrai partenariat.",
    name: "Youssouf A.",
    role: "Directeur, Supermarché — Mutsamudu",
    initials: "YA",
    grad: "from-[#22d3ee] to-[#2E86FF]",
    metric: "Visibilité financière",
    metricValue: "Temps réel",
  },
  {
    quote:
      "De la caisse au stock, tout est centralisé. Les alertes de stock nous évitent les ruptures et la trésorerie est enfin claire.",
    name: "Nassira S.",
    role: "Responsable, Pharmacie — Fomboni",
    initials: "NS",
    grad: "from-[#FFD700] to-[#2E86FF]",
    metric: "RuPTures de stock",
    metricValue: "−60%",
  },
];

const stats = [
  { value: 150, suffix: "+", label: "Entreprises accompagnées" },
  { value: 12, suffix: "", label: "Modules métiers intégrés" },
  { value: 98, suffix: "%", label: "Clients satisfaits" },
  { value: 24, suffix: "h", label: "Délai de réponse" },
];

function SectionTag({ children }: { children: React.ReactNode }) {
  return <span className="aurora-tag">{children}</span>;
}

export default function LandingPage() {
  const waDemo = buildWhatsAppLink(demoMessage());
  const waSubscribe = (plan: string) => buildWhatsAppLink(subscribeMessage(plan));
  const waNumber = siteConfig.whatsappNumber;

  return (
    <div className="relative w-full overflow-x-clip">
      {/* ================= HERO ================= */}
      <section id="accueil" className="relative flex min-h-[100svh] items-center overflow-hidden">
        <AuroraBackground className="z-0" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-36 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
          <div className="space-y-7">
            <Reveal direction="fade">
              <span className="aurora-tag">
                <Sparkles className="h-3.5 w-3.5 text-[var(--bwr-violet,#2E86FF)]" />
                ERP SaaS sécurisé, multi-tenant & adapté à l'Afrique
              </span>
            </Reveal>

            <Reveal direction="up" delay={80}>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Pilotez toute votre entreprise depuis{" "}
                <span className="aurora-gradient-text">une seule plateforme.</span>
              </h1>
            </Reveal>

            <Reveal direction="up" delay={160}>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--aurora-muted)]">
                BISWARA centralise votre gestion, automatise vos tâches et vous aide à
                prendre de meilleures décisions — CRM, ventes, stock, comptabilité, RH,
                logistique et projets dans une interface moderne et intuitive.
              </p>
            </Reveal>

            <Reveal direction="up" delay={240}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={waDemo} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="group buttons-aurora-grad w-full text-white shadow-[0_12px_40px_rgba(46,134,255,0.35)] hover:opacity-95 hover:shadow-[0_18px_50px_rgba(46,134,255,0.45)] sm:w-auto"
                  >
                    Demander une démonstration
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full border border-white/15 bg-white/5 text-white backdrop-blur-md hover:border-[rgba(46,134,255,0.55)] hover:bg-white/10 sm:w-auto"
                  >
                    Voir les tarifs
                  </Button>
                </Link>
              </div>
            </Reveal>

            {/* Stats hero */}
            <Reveal direction="up" delay={320}>
              <dl className="grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-7">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-2xl font-bold">
                      <CountUp to={s.value} suffix={s.suffix} className="aurora-gradient-text" />
                    </dt>
                    <dd className="mt-1 text-xs text-[var(--aurora-faint)]">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Dashboard visuel */}
          <Reveal direction="zoom" delay={200} className="hidden lg:block">
            <TiltCard max={5}>
              <div className="relative">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-6 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5" aria-hidden="true">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2E86FF]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#22d3ee]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    </div>
                    <span className="font-display text-xs font-semibold tracking-wide text-[var(--aurora-muted)]">
                      BISWARA — Tableau de bord
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-2.5 py-1 text-[10px] font-semibold text-green-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                      </span>
                      Live
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--aurora-faint)]">
                        Chiffre d'affaires
                      </p>
                      <p className="font-display text-3xl font-bold text-white">12 450 000</p>
                      <p className="text-xs text-[var(--aurora-faint)]">KMF</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-2.5 py-1 text-xs font-semibold text-green-400">
                      <BarChart3 className="h-3.5 w-3.5" /> +18%
                    </span>
                  </div>

                  {/* Courbe de croissance */}
                  <div className="mt-5" role="img" aria-label="Graphique de croissance en hausse">
                    <svg viewBox="0 0 320 110" preserveAspectRatio="none" className="w-full">
                      <defs>
                        <linearGradient id="bwrChartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#2E86FF" stopOpacity="0.35" />
                          <stop offset="1" stopColor="#2E86FF" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="bwrChartStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0" stopColor="#2E86FF" />
                          <stop offset="1" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <g stroke="rgba(255,255,255,0.06)">
                        <line x1="0" y1="28" x2="320" y2="28" />
                        <line x1="0" y1="56" x2="320" y2="56" />
                        <line x1="0" y1="84" x2="320" y2="84" />
                      </g>
                      <path
                        d="M0 92 C 30 88, 48 72, 70 74 S 120 44, 150 50 S 210 24, 240 30 S 300 10, 320 14 L 320 110 L 0 110 Z"
                        fill="url(#bwrChartFill)"
                      />
                      <path
                        d="M0 92 C 30 88, 48 72, 70 74 S 120 44, 150 50 S 210 24, 240 30 S 300 10, 320 14"
                        fill="none"
                        stroke="url(#bwrChartStroke)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 flex items-end gap-2" aria-hidden="true">
                    {[40, 65, 48, 80, 58, 92, 72].map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-[#2E86FF]/80 to-[#22d3ee]/50"
                        style={{ height: `${h * 0.5}px` }}
                      />
                    ))}
                  </div>
                </div>

                {/* KPI flottants */}
                <div className="absolute -left-6 -top-5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0a0d1f]/80 p-3 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] [animation:aurora-float_6s_ease-in-out_infinite]">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(46,134,255,0.15)] text-[#4BA3FF]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div>
                    <strong className="block font-display text-sm text-white">+320%</strong>
                    <span className="text-[11px] text-[var(--aurora-faint)]">de performance</span>
                  </div>
                </div>
                <div className="absolute -right-5 top-[30%] flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0a0d1f]/80 p-3 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] [animation:aurora-float_6s_ease-in-out_infinite;animation-delay:1.2s]">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(34,211,238,0.12)] text-[#22d3ee]">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <div>
                    <strong className="block font-display text-sm text-white">96%</strong>
                    <span className="text-[11px] text-[var(--aurora-faint)]">factures réglées</span>
                  </div>
                </div>
                <div className="absolute -bottom-5 left-[14%] flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0a0d1f]/80 p-3 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] [animation:aurora-float_6s_ease-in-out_infinite;animation-delay:2.4s]">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(255,215,0,0.15)] text-[#4BA3FF]">
                    <Boxes className="h-4 w-4" />
                  </span>
                  <div>
                    <strong className="block font-display text-sm text-white">1 204</strong>
                    <span className="text-[11px] text-[var(--aurora-faint)]">références en stock</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>

        {/* Indicateur de scroll */}
        <Link
          href="#fonctionnalites"
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[var(--aurora-faint)] sm:flex"
          aria-label="Défiler vers les fonctionnalités"
        >
          <span className="text-[10px] uppercase tracking-[0.18em]">Défiler</span>
          <span className="flex h-10 w-6 items-start justify-center rounded-full border border-[var(--aurora-faint)] pt-1.5">
            <span className="h-2 w-[3px] rounded-full bg-[#22d3ee] [animation:aurora-wheel_1.8s_ease-in-out_infinite]" />
          </span>
        </Link>
      </section>

      {/* ================= MARQUEE ================= */}
      <section className="border-y border-white/10 bg-white/[0.015] py-8" aria-label="Ils nous font confiance">
        <p className="mb-5 text-center text-[11px] uppercase tracking-[0.22em] text-[var(--aurora-faint)]">
          Technologies & partenaires de confiance
        </p>
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max items-center gap-12 whitespace-nowrap [animation:aurora-marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex items-center gap-12" aria-hidden={k === 1}>
                {["Mvola", "Holo", "Wakati", "Hostinger", "PostgreSQL", "Next.js", "React", "TypeScript", "WhatsApp Business"].map((name) => (
                  <span key={name} className="font-display text-lg font-semibold text-[var(--aurora-faint)] opacity-80 transition-colors hover:text-[#22d3ee] hover:opacity-100">
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= POURQUOI BISWARA ================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Pourquoi BISWARA</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Un ERP pensé pour <span className="aurora-gradient-text">réellement</span> vous servir
            </h2>
            <p className="mt-4 text-[var(--aurora-muted)]">
              Bien plus qu'un logiciel de gestion : une plateforme conçue pour les réalités des
              entreprises africaines, à la fois simple, moderne et sécurisée.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={i * 120}>
                <TiltCard max={5}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md transition-all duration-500 hover:border-[rgba(46,134,255,0.4)] hover:bg-white/[0.05] hover:shadow-[0_24px_70px_rgba(46,134,255,0.22)]">
                    <div className="aurora-chip grid h-14 w-14 place-items-center rounded-2xl text-[var(--bwr-cyan,#22d3ee)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">
                      <a.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-white">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--aurora-muted)]">{a.desc}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MODULES ================= */}
      <section id="fonctionnalites" className="relative py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Fonctionnalités</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Un module pour <span className="aurora-gradient-text">chaque besoin</span> de votre entreprise
            </h2>
            <p className="mt-4 text-[var(--aurora-muted)]">
              Activez uniquement les modules dont vous avez besoin, et faites-les évoluer avec votre activité.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <Reveal key={m.title} delay={(i % 3) * 100}>
                <TiltCard max={4}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-500 hover:border-transparent hover:bg-gradient-to-br hover:from-[rgba(46,134,255,0.1)] hover:to-[rgba(16,20,43,0.6)] hover:shadow-[0_24px_70px_rgba(46,134,255,0.25)]">
                    <span className="pointer-events-none absolute right-1.5 top-1 font-display text-5xl font-bold text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)] transition-colors group-hover:text-[rgba(34,211,238,0.35)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="aurora-chip grid h-12 w-12 place-items-center rounded-xl text-[var(--bwr-violet,#2E86FF)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3 group-hover:scale-105 group-hover:text-[#22d3ee]">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-white">{m.title}</h3>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--bwr-cyan,#22d3ee)]">
                      {m.tag}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--aurora-muted)]">{m.desc}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTEURS ================= */}
      <section id="secteurs" className="border-y border-white/10 bg-white/[0.015] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Secteurs d'activité</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Conçu pour <span className="aurora-gradient-text">votre métier</span>
            </h2>
            <p className="mt-4 text-[var(--aurora-muted)]">
              BISWARA s'adapte aux spécificités de chaque secteur pour vous faire gagner un temps précieux.
            </p>
          </Reveal>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {sectors.map((s, i) => (
              <Reveal key={s} direction="zoom" delay={(i % 6) * 60}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[var(--aurora-muted)] backdrop-blur-md transition-colors duration-300 hover:border-[rgba(34,211,238,0.4)] hover:text-white">
                  <Globe className="h-3.5 w-3.5 text-[var(--bwr-violet,#2E86FF)]" />
                  {s}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section id="comment-ca-marche" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Comment ça marche</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Souscrivez en <span className="aurora-gradient-text">4 étapes simples</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md">
                  <span className="font-display text-4xl font-bold text-transparent [-webkit-text-stroke:1px_rgba(46,134,255,0.4)]">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--aurora-muted)]">{s.desc}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="absolute -right-2 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[var(--bwr-cyan,#22d3ee)] lg:block" aria-hidden="true" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TÉMOIGNAGES ================= */}
      <section className="border-y border-white/10 bg-white/[0.015] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Ils nous font confiance</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Des <span className="aurora-gradient-text">résultats réels</span>, des clients conquis
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <TiltCard max={4}>
                  <div className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md transition-shadow duration-500 hover:border-[rgba(46,134,255,0.3)] hover:shadow-[0_20px_60px_rgba(46,134,255,0.2)]">
                    <span className="pointer-events-none absolute right-4 top-1 font-display text-6xl text-transparent [-webkit-text-stroke:1px_rgba(46,134,255,0.3)]">"</span>
                    <span className="flex gap-1 text-[var(--bwr-gold,#FFD700)]" aria-label="Note : 5 étoiles sur 5">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" aria-hidden="true">
                          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
                        </svg>
                      ))}
                    </span>
                    <p className="mt-4 flex-1 text-sm italic leading-relaxed text-[var(--aurora-muted)]">
                      « {t.quote} »
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <span className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.grad} font-display text-sm font-bold text-white`}>
                        {t.initials}
                      </span>
                      <div>
                        <strong className="block text-sm text-white">{t.name}</strong>
                        <span className="text-xs text-[var(--aurora-faint)]">{t.role}</span>
                      </div>
                    </div>
                    <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] px-3 py-1.5 text-xs font-medium text-green-400">
                      {t.metric} <strong className="font-display">{t.metricValue}</strong>
                    </span>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TARIFS ================= */}
      <section id="tarifs" className="relative py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>Tarifs</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Des tarifs simples et <span className="aurora-gradient-text">transparents</span>
            </h2>
            <p className="mt-4 text-[var(--aurora-muted)]">
              Changez de forfait à tout moment. Vos données sont conservées.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS_LIST.map((p, i) => (
              <Reveal key={p.key} delay={i * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl p-7 backdrop-blur-md transition-all duration-500 ${
                    p.highlight
                      ? "border border-[rgba(251,191,36,0.5)] bg-gradient-to-b from-[rgba(251,191,36,0.08)] to-white/[0.02] shadow-[0_24px_70px_rgba(251,191,36,0.15)]"
                      : "border border-white/10 bg-white/[0.03] hover:border-[rgba(46,134,255,0.35)]"
                  }`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--bwr-gold,#FFD700)] px-3 py-1 text-[11px] font-bold text-black">
                      Recommandé
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-white">{p.name}</h3>
                    {p.highlight && <Sparkles className="h-4 w-4 text-[#FFD700]" />}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-white">{p.price}</span>
                    <span className="text-sm text-[var(--aurora-faint)]">{p.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--aurora-faint)]">{p.users}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[var(--aurora-muted)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bwr-green,#34d399)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waSubscribe(p.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7"
                  >
                    <Button
                      className={`w-full ${
                        p.highlight
                          ? "bg-[var(--bwr-gold,#FFD700)] text-black hover:bg-[var(--bwr-gold,#FFD700)]/90"
                          : "buttons-aurora-grad text-white"
                      }`}
                    >
                      Souscrire
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="border-y border-white/10 bg-white/[0.015] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionTag>FAQ</SectionTag>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Questions <span className="aurora-gradient-text">fréquentes</span>
            </h2>
          </Reveal>
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal direction="zoom">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-xl sm:px-12">
              <div
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(46,134,255,0.35), transparent 60%), radial-gradient(circle at 70% 50%, rgba(34,211,238,0.25), transparent 55%)",
                  animation: "aurora-drift 20s ease-in-out infinite alternate",
                }}
              />
              <SectionTag>Passons à l'action</SectionTag>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Prêt à transformer la gestion de votre entreprise ?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--aurora-muted)]">
                Rejoignez BISWARA et pilotez votre activité depuis une plateforme unique,
                moderne et sécurisée. Réponse sous 24 h.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={waDemo} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="buttons-aurora-grad w-full text-white shadow-[0_12px_40px_rgba(46,134,255,0.4)] hover:opacity-95 sm:w-auto"
                  >
                    Demander une démonstration
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href={waSubscribe("Business")} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full border border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 sm:w-auto"
                  >
                    Souscrire
                  </Button>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bandeau numéro WhatsApp discret */}
      <div className="relative pb-16 text-center text-sm text-[var(--aurora-faint)]">
        Une question ? Écrivez-nous sur WhatsApp :{" "}
        <a href={waDemo} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--bwr-cyan,#22d3ee)] hover:underline">
          {waNumber}
        </a>
      </div>
    </div>
  );
}
