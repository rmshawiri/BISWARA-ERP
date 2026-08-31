"use client";

import * as React from "react";

export function PwaRegistrar() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Enregistrement non bloquant.
      });
    }
  }, []);
  return null;
}
