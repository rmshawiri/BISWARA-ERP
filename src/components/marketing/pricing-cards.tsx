import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { PLANS_LIST } from "@/lib/plans";
import { buildWhatsAppLink, subscribeMessage } from "@/lib/whatsapp";

/**
 * PricingCards — forfaits BISWARA stylés « aurora nocturne ».
 * Variante marketing sombre du composant fonctionnel PlanCards.
 */
export function PricingCards({ className }: { className?: string }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`}>
      {PLANS_LIST.map((p, i) => (
        <Reveal key={p.key} delay={i * 100}>
          <div
            className={`relative flex h-full flex-col rounded-2xl p-7 backdrop-blur-md transition-all duration-500 ${
              p.highlight
                ? "border border-[rgba(251,191,36,0.5)] bg-gradient-to-b from-[rgba(251,191,36,0.08)] to-white/[0.02] shadow-[0_24px_70px_rgba(251,191,36,0.15)]"
                : "border border-white/10 bg-white/[0.03] hover:border-[rgba(124,92,255,0.35)]"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--bwr-gold,#fbbf24)] px-3 py-1 text-[11px] font-bold text-black">
                Recommandé
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">{p.name}</h3>
              {p.highlight && <Sparkles className="h-4 w-4 text-[#fbbf24]" />}
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
              href={buildWhatsAppLink(subscribeMessage(p.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7"
            >
              <Button
                className={`w-full ${
                  p.highlight
                    ? "bg-[var(--bwr-gold,#fbbf24)] text-black hover:bg-[var(--bwr-gold,#fbbf24)]/90"
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
  );
}
