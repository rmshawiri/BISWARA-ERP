import { cn } from "@/lib/utils";

/**
 * Logo BISWARA — élément protégé.
 * Le logo officiel NE DOIT PAS être modifié. Ici nous rendons le nom
 * + un pictogramme de marque (carré bleu MORA). Les assets officiels
 * (SVG fournis) seront utilisés via /public/logo/ pour le rendu exact.
 */
export function BiswaraLogo({
  className,
  showSlogan = false,
}: {
  className?: string;
  showSlogan?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-biswara-blue">
        <span className="font-bold text-biswara-gold">B</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-biswara-blue">
          BISWARA
        </span>
        {showSlogan && (
          <span className="text-[10px] text-muted-foreground">
            Le Choix Optimal pour votre performance.
          </span>
        )}
      </div>
    </div>
  );
}
