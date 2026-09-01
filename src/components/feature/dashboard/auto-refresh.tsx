"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * AutoRefresh — actualisation "temps réel" côté client.
 *
 * Dans l'App Router, `useRouter().refresh()` re-rend les Server Components de
 * la route courante (récupérant les dernières données en base) SANS perdre
 * l'état des composants client. Ce composant déclenche ce rafraîchissement :
 *  - périodiquement (intervalle configurable, défaut 30 s) ;
 *  - lorsque l'onglet/fenêtre reprend le focus.
 *
 * Il est monté une seule fois dans les layouts (espace connecté + admin) pour
 * que toutes les pages bénéficient d'actualisations quasi temps réel.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, router]);

  return null;
}
