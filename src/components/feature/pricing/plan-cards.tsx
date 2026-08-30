import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS_LIST } from "@/lib/plans";
import { buildWhatsAppLink, subscribeMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function PlanCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {PLANS_LIST.map((p) => (
        <div
          key={p.key}
          className={cn(
            "relative flex flex-col rounded-xl border bg-card p-6 shadow-sm",
            p.highlight && "border-biswara-gold ring-2 ring-biswara-gold/40"
          )}
        >
          {p.highlight && (
            <Badge
              variant="gold"
              className="absolute -top-3 left-1/2 -translate-x-1/2"
            >
              Recommandé
            </Badge>
          )}
          <h3 className="font-semibold">{p.name}</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold">{p.price}</span>
            <span className="text-sm text-muted-foreground">{p.period}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{p.users}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-biswara-green" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <a
            href={buildWhatsAppLink(subscribeMessage(p.name))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6"
          >
            <Button
              className="w-full"
              variant={p.highlight ? "accent" : "default"}
            >
              Souscrire
            </Button>
          </a>
        </div>
      ))}
    </div>
  );
}
