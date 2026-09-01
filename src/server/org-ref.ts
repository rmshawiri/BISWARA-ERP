import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";

/** Type lâche pour une colonne Drizzle (compatible AnyPgColumn / SQL). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Col = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tbl = any;

/**
 * Sécurité multi-tenant : vérifie qu'une ligne (table scopée par organisation)
 * existe ET appartient à l'organisation. À utiliser pour valider toute FK parent
 * fournie par l'utilisateur avant insertion, car le client Drizzle contourne RLS.
 */
export async function assertOrgRef(
  table: Tbl,
  idCol: Col,
  orgCol: Col,
  id: string,
  orgId: string
): Promise<boolean> {
  if (!id) return false;
  const rows = await db()
    .select({ id: idCol })
    .from(table)
    .where(and(eq(idCol, id), eq(orgCol, orgId)))
    .limit(1);
  return rows.length > 0;
}
