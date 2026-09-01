"use client";

import * as React from "react";

export default function AdminAreaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[bwr-error][admin]", error);
  }, [error]);

  return (
    <div className="grid place-items-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-4 text-xl font-bold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème inattendu s'est produit dans l'administration. Vous pouvez réessayer.
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
