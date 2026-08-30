import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions Légales — BISWARA ERP" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Mentions Légales</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          BISWARA ERP OS est une plateforme édité par MORA Shawiri. Le détail
          complet des mentions légales (éditeur, hébergeur, contact) sera publié
          dans la version de production.
        </p>
      </div>
    </div>
  );
}
