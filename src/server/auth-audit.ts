"use server";

import { getAuthzContext } from "@/server/auth";
import { logAudit } from "@/engines/audit";

/**
 * Journalise un événement d'authentification (connexion / déconnexion).
 * Utilisé côté client en fire-and-forget après le succès de l'opération.
 */
export async function logAuthEvent(event: "login" | "logout") {
  try {
    const ctx = await getAuthzContext();
    if (!ctx) return;
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: ctx.organization?.id ?? null,
      module: "auth",
      action: `auth.${event}`,
      entityType: "session",
      entityId: ctx.user.id,
    });
  } catch {
    // Ne bloque jamais l'action d'auth.
  }
}
