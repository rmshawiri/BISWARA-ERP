import "server-only";

import { eq, and, sql } from "drizzle-orm";
import { createHmac } from "node:crypto";
import { db } from "@/db";
import { webhooks } from "@/db/schema";

/**
 * WEBHOOK ENGINE — envoie un événement métier vers les URL de webhooks
 * configurées par l'organisation (automatisation d'échanges avec des
 * systèmes externes, conformément à la documentation BISWARA §6.3).
 *
 * - Cible les webhooks actifs de l'organisation dont l'événement correspond.
 * - Envoie un POST (ou la méthode configurée) avec un payload JSON :
 *   { event, organizationId, deliveredAt, data }.
 * - Si une `secret_key` est définie, ajoute un en-tête de signature HMAC-SHA256
 *   (`x-biswara-signature: sha256=<hex>`), consommable par le récepteur.
 * - Met à jour `last_delivery_at` / `delivery_count`.
 * - Toujours non bloquant : en cas d'échec réseau/HTTP, l'action métier continue.
 */

export async function dispatchWebhook(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const rows = await db()
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.organizationId, organizationId),
          eq(webhooks.active, true)
        )
      );

    const body = JSON.stringify({
      event,
      organizationId,
      deliveredAt: new Date().toISOString(),
      data: payload,
    });

    for (const w of rows) {
      // Un webhook "all" reçoit tout ; sinon l'événement doit correspondre.
      if (w.event !== "all" && w.event !== event) continue;

      const method = (w.method || "POST").toUpperCase();
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "user-agent": "biswara-erp-webhook/1.0",
      };
      if (w.secretKey) {
        headers["x-biswara-signature"] = `sha256=${createHmac("sha256", w.secretKey).update(body).digest("hex")}`;
      }

      try {
        await fetch(w.url, {
          method,
          headers,
          body,
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        /* best-effort */
      }
      try {
        await db()
          .update(webhooks)
          .set({
            lastDeliveryAt: new Date(),
            deliveryCount: sql`${webhooks.deliveryCount} + 1`,
          })
          .where(eq(webhooks.id, w.id));
      } catch {
        /* best-effort */
      }
    }
  } catch {
    // Ne jamais bloquer l'action métier.
    console.error("[WebhookEngine] échec du dispatch.", event);
  }
}
