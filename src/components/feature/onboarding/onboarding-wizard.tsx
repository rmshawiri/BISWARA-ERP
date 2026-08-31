"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Building2, Sparkles } from "lucide-react";
import { updateOrganizationSettingsAction } from "@/modules/settings/actions";
import { toggleOrgModuleAction, toggleOrgActivityAction } from "@/modules/activities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function OnboardingWizard({
  org,
  modules,
  activities,
}: {
  org: { id: string; name: string; city: string | null; slogan: string | null; currency: string };
  modules: { id: string; name: string }[];
  activities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [city, setCity] = React.useState(org.city ?? "");
  const [slogan, setSlogan] = React.useState(org.slogan ?? "");
  const [selectedModules, setSelectedModules] = React.useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = React.useState<Set<string>>(new Set());

  function toggleSet(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function next() {
    if (step === 1) {
      const fd = new FormData();
      fd.set("name", org.name);
      fd.set("slogan", slogan);
      fd.set("city", city);
      fd.set("currency", org.currency);
      fd.set("country", "KM");
      const res = await updateOrganizationSettingsAction(fd);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur d'enregistrement");
        return;
      }
      setStep(2);
      return;
    }
    setPending(true);
    for (const id of selectedModules) await toggleOrgModuleAction(id, true);
    for (const id of selectedActivities) await toggleOrgActivityAction(id, true);
    toast.success("Bienvenue sur BISWARA !");
    router.push("/app");
    router.refresh();
  }

  const steps = ["Organisation", "Modules & activités", "Terminer"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Barre de progression */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                "h-1 rounded-full",
                step >= i + 1 ? "bg-primary" : "bg-muted"
              )}
            />
            <span className="text-[11px] text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Votre organisation</h2>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={org.name} disabled className="h-8" />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Votre slogan" className="h-8" />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Moroni" className="h-8" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Modules & activités</h2>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Modules de base</p>
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => {
                  const on = selectedModules.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleSet(selectedModules, setSelectedModules, m.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium",
                        on ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      {on && <Check className="mr-1 inline h-3.5 w-3.5" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Activités métier</p>
              <div className="flex flex-wrap gap-2">
                {activities.map((a) => {
                  const on = selectedActivities.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleSet(selectedActivities, setSelectedActivities, a.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium",
                        on ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      {on && <Check className="mr-1 inline h-3.5 w-3.5" />}
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedModules.size} modules</Badge>
              <Badge variant="secondary">{selectedActivities.size} activités</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h2 className="text-xl font-bold">Vous êtes prêt !</h2>
            <p className="text-muted-foreground">
              Votre espace BISWARA est configuré. Accédez à votre tableau de bord.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Button>
        <Button onClick={next} disabled={pending}>
          {step === 3 ? "Terminer" : "Continuer"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
