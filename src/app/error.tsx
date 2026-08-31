"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Journaliser côté client (pas de fuite de données sensibles).
    console.error("[bwr-error]", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-bold">Une erreur est survenue</h1>
        <p className="mt-2 text-muted-foreground">
          Un problème inattendu s'est produit. Vous pouvez réessayer.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
