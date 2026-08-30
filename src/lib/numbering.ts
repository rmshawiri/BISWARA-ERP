/**
 * Numérotation des documents par organisation.
 * Format : {PREFIX}-{YEAR}-{SEQ} (ex : FAC-2026-000001).
 * Configurable dans Paramètres (Sprint 3).
 */

export interface NumberingOptions {
  prefix: string;
  year: number;
  seq: number;
  pad?: number;
}

export function buildDocumentNumber({
  prefix,
  year,
  seq,
  pad = 6,
}: NumberingOptions): string {
  return `${prefix}-${year}-${String(seq).padStart(pad, "0")}`;
}

export function parseDocumentNumber(number: string): NumberingOptions | null {
  const m = /^([A-Z]+)-(\d{4})-(\d+)$/.exec(number);
  if (!m) return null;
  return {
    prefix: m[1]!,
    year: Number(m[2]),
    seq: Number(m[3]),
  };
}

/** Génère une séquence fichier/nombre unique (léger, local). */
export function sequenceKey(prefix: string, organizationId: string, year: number) {
  return `${prefix}:${organizationId}:${year}`;
}
