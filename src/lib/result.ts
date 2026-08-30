/**
 * Type de résultat uniforme pour la couche service.
 * Permet des erreurs typées et une gestion propre (pas de throw généralisé
 * pour les erreurs métier attendues).
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/** Tente une opération et transforme une exception en erreur typée. */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inattendue";
    return { ok: false, error: message };
  }
}
