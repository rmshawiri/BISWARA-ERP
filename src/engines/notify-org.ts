import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createNotification } from "./notification";

const ORG_USERS_LIMIT = 30;

/**
 * Notifie les utilisateurs d'une organisation (Notification Engine).
 * Best-effort : ne lève jamais.
 */
export async function notifyOrgUsers(
  organizationId: string,
  title: string,
  body?: string,
  link?: string,
  module?: string
): Promise<void> {
  try {
    const rows = await db()
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.organizationId, organizationId))
      .limit(ORG_USERS_LIMIT);
    for (const r of rows) {
      await createNotification({
        userId: r.id,
        organizationId,
        module,
        title,
        body,
        link,
      });
    }
  } catch {
    // Non bloquant.
  }
}
