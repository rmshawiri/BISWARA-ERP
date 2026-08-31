"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createTask, updateTaskProgress } from "./service";
import type { Result } from "@/lib/result";

export async function createTaskAction(payload: {
  projectId: string;
  title: string;
  dueDate?: string;
  weight?: number;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!payload.title?.trim()) return { ok: false, error: "Titre requis." };
  const res = await createTask(ctx, payload.projectId, {
    title: payload.title.trim(),
    dueDate: payload.dueDate || null,
    weight: payload.weight ?? 1,
  });
  if (res.ok) revalidatePath("/app/projets");
  return res;
}

export async function updateTaskProgressAction(
  taskId: string,
  progress: number,
  status?: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await updateTaskProgress(ctx, taskId, progress, status);
  if (res.ok) revalidatePath("/app/projets");
  return res;
}
