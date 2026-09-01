import "server-only";

import { redirect } from "next/navigation";
import { getAllowedModules } from "@/modules/navigation";
import type { AuthzContext } from "@/types";
import type { ModuleKey } from "@/lib/constants";

/**
 * Garde d'accès par module : redirige vers /app si le module n'est pas
 * accessible (forfait non autorisé, module non activé, permission "view" absente).
 */
export async function requireModuleAccess(
  ctx: AuthzContext,
  module: ModuleKey
): Promise<void> {
  const allowed = await getAllowedModules(ctx);
  if (!allowed.includes(module)) redirect("/app");
}
