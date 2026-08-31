"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { exportOrgData, resetOrgData } from "@/engines/backup";
import type { Result } from "@/lib/result";

export async function exportBackupAction(): Promise<
  Result<{ filename: string; json: string }>
> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  return exportOrgData(ctx);
}

export async function resetDataAction(): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await resetOrgData(ctx);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
