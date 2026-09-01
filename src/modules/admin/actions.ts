"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import {
  createRole,
  deleteRole,
  setRolePermissions,
  assignRoleToUser,
  createOrgCollaborator,
} from "./service";
import type { Result } from "@/lib/result";

export async function createRoleAction(form: FormData): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || undefined;
  if (!name) return { ok: false, error: "Nom requis." };
  const res = await createRole(ctx, name, description);
  if (res.ok) revalidatePath("/app/administration");
  return res;
}

export async function deleteRoleAction(roleId: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await deleteRole(ctx, roleId);
  if (res.ok) revalidatePath("/app/administration");
  return res;
}

export async function setRolePermissionsAction(
  roleId: string,
  perms: { module: string; action: string }[]
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await setRolePermissions(ctx, roleId, perms);
  if (res.ok) revalidatePath("/app/administration");
  return res;
}

export async function assignRoleToUserAction(
  userId: string,
  roleId: string,
  assign: boolean
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await assignRoleToUser(ctx, userId, roleId, assign);
  if (res.ok) revalidatePath("/app/administration");
  return res;
}

export async function createOrgCollaboratorAction(payload: {
  fullName: string;
  username: string;
  email: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!payload.fullName?.trim() || !payload.username?.trim() || !payload.email?.trim()) {
    return { ok: false, error: "Nom, identifiant et e-mail requis." };
  }
  const res = await createOrgCollaborator(ctx, payload);
  if (res.ok) revalidatePath("/app/administration");
  return res;
}
