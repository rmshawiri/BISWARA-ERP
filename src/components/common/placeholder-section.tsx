import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Écran provisoire d'un module en construction (style premium).
 * Sera remplacé par le module réel au sprint correspondant.
 */
export function PlaceholderSection({
  title,
  description,
  sprint,
}: {
  title: string;
  description: string;
  sprint: string;
}) {
  return (
    <div className="space-y-5 animate-in-up">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge variant="outline" className="border-biswara-gold-500/40 text-biswara-gold-700">
          {sprint}
        </Badge>
      </div>
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-biswara-violet-500 to-biswara-cyan-500" />
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" />
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/12 to-biswara-violet-500/12 p-4 text-primary">
              <Construction className="h-9 w-9" />
            </div>
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
