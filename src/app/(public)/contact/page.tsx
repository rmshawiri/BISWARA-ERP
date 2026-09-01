import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { buildWhatsAppLink, demoMessage } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact — BISWARA ERP",
  description: "Contactez l'équipe BISWARA (MORA Shawiri).",
};

const contactMethods = [
  {
    Icon: Phone,
    label: "Téléphone / WhatsApp",
    value: siteConfig.phoneDisplay,
    accent: "text-[var(--bwr-cyan,#22d3ee)]",
    bg: "border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.1)]",
    href: buildWhatsAppLink(demoMessage()),
  },
  {
    Icon: MessageCircle,
    label: "WhatsApp Business",
    value: "Écrire sur WhatsApp",
    accent: "text-[var(--bwr-green,#34d399)]",
    bg: "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.1)]",
    href: buildWhatsAppLink(demoMessage()),
  },
  {
    Icon: Mail,
    label: "E-mail",
    value: siteConfig.email,
    accent: "text-[var(--bwr-violet,#2E86FF)]",
    bg: "border-[rgba(255,215,0,0.2)] bg-[rgba(255,215,0,0.1)]",
    href: `mailto:${siteConfig.email}`,
  },
  {
    Icon: MapPin,
    label: "Adresse",
    value: siteConfig.address,
    accent: "text-[var(--bwr-cyan,#22d3ee)]",
    bg: "border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.1)]",
    href: `https://www.google.com/maps/search/${encodeURIComponent(siteConfig.address)}`,
  },
  {
    Icon: Globe,
    label: "Site web",
    value: siteConfig.site,
    accent: "text-[var(--bwr-green,#34d399)]",
    bg: "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.1)]",
    href: `https://${siteConfig.site}`,
  },
];

export default function ContactPage() {
  const waDemo = buildWhatsAppLink(demoMessage());
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,215,0,0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="aurora-tag">Contact</span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Parlons de <span className="aurora-gradient-text">votre projet</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--aurora-muted)]">
            Une question, une démonstration ? Notre équipe vous répond sous 24 h.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {contactMethods.map((c, i) => {
            const isMail = c.href.startsWith("mailto:");
            return (
              <Reveal key={c.label} delay={i * 100}>
                <a
                  href={c.href}
                  target={isMail ? undefined : "_blank"}
                  rel={isMail ? undefined : "noopener noreferrer"}
                  className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border ${c.bg} ${c.accent}`}>
                    <c.Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 font-display text-base font-semibold text-white">{c.label}</p>
                  <p className={`mt-1.5 text-sm ${c.accent}`}>{c.value}</p>
                </a>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200} className="mt-10">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(circle, rgba(46,134,255,0.25), transparent 60%), radial-gradient(circle at 80% 20%, rgba(34,211,238,0.2), transparent 55%)",
              }}
            />
            <h2 className="font-display text-2xl font-bold text-white">
              Besoin d'une démonstration ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[var(--aurora-muted)]">
              Écrivez-nous sur WhatsApp et notre équipe vous présente BISWARA adapté à votre secteur.
            </p>
            <a href={waDemo} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
              <Button size="lg" className="buttons-aurora-grad text-white shadow-[0_12px_40px_rgba(46,134,255,0.4)] hover:opacity-95">
                <MessageCircle className="h-4 w-4" />
                Demander une démonstration
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
