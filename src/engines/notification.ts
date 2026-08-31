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

/**
 * Canal e-mail — best-effort. Nécessite un fournisseur SMTP en production
 * (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) ainsi qu'un transporteur côté serveur.
 * Sans configuration, on journalise l'intention (aucune dépendance externe).
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn("[NotificationEngine] SMTP non configuré — e-mail non envoyé:", input.subject, "->", input.to);
    return { ok: true };
  }
  // Point d'intégration SMTP (nodemailer ou équivalent) à brancher en prod.
  console.info("[NotificationEngine] Email ready-to-send:", input.subject, "->", input.to);
  return { ok: true };
}

/**
 * Canal WhatsApp — best-effort. Nécessite WHATSAPP_PROVIDER_TOKEN/
 * WHATSAPP_PHONE_NUMBER_ID (Meta Cloud API ou Twilio) en production.
 */
export async function sendWhatsApp(input: {
  to: string;
  text: string;
}): Promise<{ ok: boolean }> {
  const token = process.env.WHATSAPP_PROVIDER_TOKEN;
  if (!token) {
    console.warn("[NotificationEngine] WhatsApp non configuré — message non envoyé:", input.text, "->", input.to);
    return { ok: true };
  }
  console.info("[NotificationEngine] WhatsApp ready-to-send:", input.text, "->", input.to);
  return { ok: true };
}
