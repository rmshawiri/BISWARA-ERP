import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Écran provisoire pour un module en cours de construction.
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant="gold">{sprint}</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-xl bg-biswara-blue/10 p-3 text-biswara-blue">
            <Construction className="h-8 w-8" />
          </div>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
