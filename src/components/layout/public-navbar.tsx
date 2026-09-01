"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { BiswaraLogo } from "@/components/brand/biswara-logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#secteurs", label: "Secteurs" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-white/10 bg-[#05060f]/85 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BISWARA — accueil" className="shrink-0">
          <BiswaraLogo variant="dark" />
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-[var(--aurora-muted)] transition-colors hover:text-[var(--aurora-ink)]"
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-[var(--aurora-grad)] transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--aurora-muted)] hover:text-white hover:bg-white/10"
            >
              Se connecter
            </Button>
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              className="buttons-aurora-grad text-white shadow-[0_12px_40px_rgba(46,134,255,0.35)] hover:opacity-95 hover:shadow-[0_18px_50px_rgba(46,134,255,0.45)]"
            >
              Souscrire
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Burger mobile */}
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Panneau mobile */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav
          className="mx-3 mb-3 flex flex-col rounded-2xl border border-white/10 bg-[#05060f]/95 p-4 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          aria-label="Navigation mobile"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-white/5 px-2 py-3 text-base font-medium text-[var(--aurora-muted)] transition-colors hover:text-white"
            >
              {l.label}
              <ArrowUpRight className="h-4 w-4 opacity-40" />
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 px-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-[var(--aurora-muted)] hover:text-white hover:bg-white/10">
                Se connecter
              </Button>
            </Link>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <Button className="buttons-aurora-grad w-full text-white">Souscrire</Button>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
