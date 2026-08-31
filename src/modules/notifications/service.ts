import "server-only";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  module: string | null;
  priority: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

/** Notifications de l'utilisateur connecté. */
export async function listNotifications(
  ctx: AuthzContext,
  opts: { limit?: number } = {}
): Promise<Result<AppNotification[]>> {
  try {
    const limit = Math.min(100, opts.limit ?? 50);
    const rows = await db()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return ok(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        module: r.module,
        priority: r.priority,
        isRead: r.isRead,
        link: r.link,
        createdAt: r.createdAt,
      }))
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Nombre de notifications non lues. */
export async function countUnread(
  ctx: AuthzContext
): Promise<Result<number>> {
  try {
    const rows = await db()
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return ok(rows.length);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Marque une notification comme lue. */
export async function markRead(
  ctx: AuthzContext,
  id: string
): Promise<Result<boolean>> {
  try {
    await db()
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, ctx.user.id)));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export async function markAllRead(
  ctx: AuthzContext
): Promise<Result<boolean>> {
  try {
    await db()
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Supprime une notification. */
export async function deleteNotification(
  ctx: AuthzContext,
  id: string
): Promise<Result<boolean>> {
  try {
    await db()
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, ctx.user.id)));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suppression");
  }
}
