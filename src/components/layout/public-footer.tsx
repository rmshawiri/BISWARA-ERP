import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import { siteConfig } from "@/lib/config";

const productLinks = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#secteurs", label: "Secteurs d'activité" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
];

const resourceLinks = [
  { href: "/blog", label: "Blog & Actualités" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/conditions", label: "Conditions Générales" },
];

const legalLinks = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions", label: "Mentions légales" },
];

const socials = [
  { label: "LinkedIn", href: "#", Icon: Linkedin },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "Instagram", href: "#", Icon: Instagram },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/10 bg-[#05060f]">
      {/* lueur supérieure */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(124,92,255,0.16),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <BiswaraLogo variant="dark" showSlogan />
            <p className="max-w-sm text-sm leading-relaxed text-[var(--aurora-faint)]">
              {siteConfig.description}
            </p>
            <div className="flex gap-3 pt-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--aurora-muted)] transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-[var(--aurora-grad)] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Produit" links={productLinks} />
          <FooterCol title="Ressources" links={resourceLinks} />
          <FooterCol title="Légal" links={legalLinks} />
        </div>

        {/* Contact */}
        <div className="mt-12 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-3">
          <ContactItem Icon={Phone} label="Téléphone / WhatsApp" value={siteConfig.whatsappNumber} />
          <ContactItem Icon={Mail} label="E-mail" value="contact@biswara.com" />
          <ContactItem Icon={MapPin} label="Pays" value="Comores — Union des Comores" />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-[var(--aurora-faint)] sm:flex-row">
          <p>
            © {year} {siteConfig.name} — {siteConfig.author}
          </p>
          <p className="flex items-center gap-1.5">
            Conçu avec <span className="text-[var(--bwr-cyan,#22d3ee)]">♥</span> pour les entreprises africaines.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--aurora-ink)]">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[var(--aurora-faint)] transition-colors hover:text-[var(--bwr-cyan,#22d3ee)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactItem({
  Icon,
  label,
  value,
}: {
  Icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.1)] text-[var(--bwr-cyan,#22d3ee)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--aurora-faint)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-[var(--aurora-ink)]">{value}</p>
      </div>
    </div>
  );
}
