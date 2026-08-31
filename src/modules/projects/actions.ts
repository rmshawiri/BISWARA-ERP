"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createProject } from "./service";
import type { Result } from "@/lib/result";

export async function createProjectAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const name = String(form.get("name") || "").trim();
  if (!name) return { ok: false, error: "Nom du projet requis." };
  try {
    const res = await createProject(ctx, {
      name,
      description: form.get("description") ? String(form.get("description")) : null,
      startDate: form.get("startDate") ? String(form.get("startDate")) : null,
      dueDate: form.get("dueDate") ? String(form.get("dueDate")) : null,
    });
    if (res.ok) revalidatePath("/app/projets");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
