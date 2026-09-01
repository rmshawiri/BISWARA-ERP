"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { updateSystemSetting } from "./system-settings";
import type { Result } from "@/lib/result";

export async function updateSystemSettingAction(
  key: string,
  value: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await updateSystemSetting(ctx, key, value);
  if (res.ok) revalidatePath("/admin/parametres");
  return res;
}
