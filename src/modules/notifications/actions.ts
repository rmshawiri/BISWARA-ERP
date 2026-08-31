"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import {
  markRead,
  markAllRead,
  deleteNotification,
} from "./service";
import type { Result } from "@/lib/result";

export async function markReadAction(id: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx) return { ok: false, error: "Authentification requise." };
  const res = await markRead(ctx, id);
  if (res.ok) revalidatePath("/app/notifications");
  return res;
}

export async function markAllReadAction(): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx) return { ok: false, error: "Authentification requise." };
  const res = await markAllRead(ctx);
  if (res.ok) revalidatePath("/app/notifications");
  return res;
}

export async function deleteNotificationAction(
  id: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx) return { ok: false, error: "Authentification requise." };
  const res = await deleteNotification(ctx, id);
  if (res.ok) revalidatePath("/app/notifications");
  return res;
}
