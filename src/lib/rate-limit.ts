/**
 * Rate-limiting en mémoire (baseline). En production multi-instance,
 * utiliser un store partagé (Redis) — mais ce garde-fou limitera déjà
 * les tentatives répétées sur une même instance.
 */
const attempts = new Map<string, { count: number; ts: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Vérifie et enregistre une tentative pour une clé donnée. */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cur = attempts.get(key);
  if (!cur || now - cur.ts > windowMs) {
    attempts.set(key, { count: 1, ts: now });
    return { allowed: true, remaining: max - 1 };
  }
  cur.count += 1;
  attempts.set(key, cur);
  return { allowed: cur.count <= max, remaining: Math.max(0, max - cur.count) };
}

/** Réinitialise les tentatives pour une clé (après un login réussi). */
export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
