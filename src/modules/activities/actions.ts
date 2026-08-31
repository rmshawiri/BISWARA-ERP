"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { setOrgActivity, setOrgModule } from "./service";
import type { Result } from "@/lib/result";

export async function toggleOrgActivityAction(
  activityId: string,
  active: boolean
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await setOrgActivity(ctx, activityId, active);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}

export async function toggleOrgModuleAction(
  moduleId: string,
  active: boolean
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await setOrgModule(ctx, moduleId, active);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
