"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createTicket, updateTicketStatus } from "./service";
import type { Result } from "@/lib/result";

export async function createTicketAction(payload: {
  subject: string;
  category: string;
  priority: string;
  message: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!payload.subject?.trim() || !payload.message?.trim())
    return { ok: false, error: "Objet et message requis." };
  const res = await createTicket(ctx, payload);
  if (res.ok) revalidatePath("/app/support");
  return res;
}

export async function updateTicketStatusAction(
  id: string,
  status: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await updateTicketStatus(ctx, id, status);
  if (res.ok) {
    revalidatePath("/admin/support");
    revalidatePath("/app/support");
  }
  return res;
}
