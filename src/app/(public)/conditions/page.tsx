import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions Générales — BISWARA ERP" };

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Conditions Générales</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          Ces conditions générales d'utilisation régissent l'accès et l'usage de
          la plateforme BISWARA ERP OS édité par MORA Shawiri. Le détail
          contractuel complet sera fourni dans la version de production.
        </p>
        <p>
          En utilisant BISWARA, vous acceptez de respecter les règles d'usage,
          les règles de sécurité et les limitations applicables à votre forfait.
        </p>
      </div>
    </div>
  );
}
