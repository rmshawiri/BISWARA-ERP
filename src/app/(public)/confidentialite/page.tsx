import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité — BISWARA ERP" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          BISWARA protège les données de ses utilisateurs. Chaque organisation
          dispose d'un espace totalement isolé, et les accès sont strictement
          contrôlés par des permissions.
        </p>
        <p>
          Les données sensibles sont chiffrées et les secrets (clés Supabase,
          tokens) ne sont jamais exposés au navigateur. Le détail complet sera
          publié dans la version de production.
        </p>
      </div>
    </div>
  );
}
