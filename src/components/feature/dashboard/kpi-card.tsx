import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const toneMap: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  violet: "bg-biswara-violet-500/12 text-biswara-violet-600",
  cyan: "bg-biswara-cyan-500/12 text-biswara-cyan-600",
  green: "bg-biswara-green-500/12 text-biswara-green-600",
  amber: "bg-biswara-gold-500/14 text-biswara-gold-700",
  rose: "bg-rose-500/12 text-rose-600",
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  tone = "primary",
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: { value: string; up?: boolean };
  tone?: keyof typeof toneMap;
  suffix?: string;
}) {
  const up = change?.up ?? true;
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("rounded-xl p-2.5", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                up ? "bg-biswara-green-500/12 text-biswara-green-600" : "bg-rose-500/12 text-rose-600"
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {change.value}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight">
            {value}
            {suffix && <span className="ml-0.5 text-sm font-medium text-muted-foreground">{suffix}</span>}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
      <div className="pointer-events-none absolute inset-x-4 -bottom-10 h-10 rounded-full bg-gradient-to-r from-primary/10 to-biswara-violet-500/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
    </Card>
  );
}
