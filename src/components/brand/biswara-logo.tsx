import { cn } from "@/lib/utils";

/**
 * Logo BISWARA — élément PROTÉGÉ.
 * Le logo officiel (carré, fond blanc) est utilisé tel quel via les assets
 * de /public/logo. On ne modifie ni ses couleurs, ni ses proportions :
 * l'interface s'adapte au logo (version pour fond clair ou fond sombre).
 */
export function BiswaraLogo({
  className,
  variant = "light",
  showSlogan = false,
}: {
  className?: string;
  /** 'light' = sur fond clair, 'dark' = sur fond sombre */
  variant?: "light" | "dark";
  showSlogan?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset statique officiel */}
      <img
        src={
          variant === "dark"
            ? "/logo/logo-biswara-horizontal-dark.png"
            : "/logo/logo-biswara-horizontal-light.png"
        }
        alt="BISWARA"
        className="h-8 w-auto shrink-0 object-contain"
      />
      {showSlogan && (
        <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">
          Le Choix Optimal pour votre performance.
        </span>
      )}
    </div>
  );
}
