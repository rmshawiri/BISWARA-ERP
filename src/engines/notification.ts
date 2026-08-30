import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationPriority = "low" | "normal" | "important" | "critical";

export interface CreateNotificationInput {
  userId: string;
  organizationId?: string | null;
  module?: string | null;
  title: string;
  body?: string | null;
  priority?: NotificationPriority;
  link?: string | null;
}

/**
 * NOTIFICATION ENGINE — crée une notification interne BISWARA pour un
 * utilisateur. Toutes les notifications de la plateforme transitent par ici.
 *
 * À venir (Sprint 4) : diffusion e-mail / WhatsApp via le Notification Engine
 * (les canaux sont indépendants de la notification interne).
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ ok: boolean }> {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    organization_id: input.organizationId ?? null,
    module: input.module ?? null,
    title: input.title,
    body: input.body ?? null,
    priority: input.priority ?? "normal",
    link: input.link ?? null,
  });
  if (error) {
    console.error("[NotificationEngine] Échec:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
