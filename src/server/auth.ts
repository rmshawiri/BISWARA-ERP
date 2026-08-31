import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";
import { AuthzContext, Organization } from "@/types";
import { resolvePermissions } from "@/server/rbac";

const PROFILE_TABLE = "profiles";
const ORG_TABLE = "organizations";

/** Mappe une ligne DB `profiles` (snake_case) vers le type `UserProfile` (camelCase). */
function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id ?? ""),
    username: String(row.username ?? ""),
    fullName: String(row.full_name ?? ""),
    email: (row.email as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    role: (row.role as UserProfile["role"]) ?? "user",
    organizationId: row.organization_id ? String(row.organization_id) : null,
    status: (row.status as UserProfile["status"]) ?? "active",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

/**
 * Récupère le profil complet de l'utilisateur connecté (côté serveur).
 * Retourne null si non authentifié.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return mapProfile(profile as Record<string, unknown>);
}
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { supabase, user, profile: mapProfile(profile as Record<string, unknown>) };
}

/**
 * Contexte de sécurité complet (authz) pour l'utilisateur connecté :
 * profil + organisation + permissions résolues.
 */
export async function getAuthzContext(): Promise<AuthzContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from(PROFILE_TABLE)
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const profileData = mapProfile(profile as Record<string, unknown>);
    const superAdmin = profileData.role === "super_admin";

    let organization: Organization | null = null;
    if (profileData.organizationId) {
      const { data: org } = await supabase
        .from(ORG_TABLE)
        .select("*")
        .eq("id", profileData.organizationId)
        .single();
      organization = (org as Organization) ?? null;
    }

    // C2 — Blocage d'accès : une organisation suspendue, ou dont l'abonnement
    // n'est plus actif, ne peut pas être utilisée (isolation + règle forfait).
    // Le Super Admin (aucune organisation) n'est jamais bloqué.
    if (!superAdmin && organization) {
      const blocked = await isOrganizationBlocked(supabase, organization);
      if (blocked) return null;
    }

    const permissions = await resolvePermissions(supabase, profileData);
    return { user: profileData, organization, superAdmin, permissions };
  } catch (e) {
    console.error("[bwr-auth] getAuthzContext a échoué :", e);
    return null;
  }
}

/** Accès réservé au Super Admin. */
export async function requireSuperAdmin(): Promise<AuthzContext> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) {
    redirect("/login");
  }
  return ctx;
}

/** Accès réservé aux utilisateurs d'une organisation (pas Super Admin). */
export async function requireOrganizationUser(): Promise<AuthzContext> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    redirect("/login");
  }
  return ctx;
}

/**
 * Vérifie si l'accès à une organisation doit être bloqué.
 * - L'organisation est suspendue → bloqué.
 * - L'abonnement actif de l'organisation n'est plus actif → bloqué.
 * - Aucun abonnement enregistré : on laisse passer (mode compat / avant seed).
 * Retourne `true` si l'accès doit être refusé.
 */
export async function isOrganizationBlocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organization: Organization
): Promise<boolean> {
  // 1. Statut de l'organisation
  if (organization.status === "suspended") return true;

  // 2. Statut de l'abonnement le plus récent
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub && sub.status && !["active", "trial"].includes(sub.status)) {
      return true;
    }
  } catch {
    // En cas d'erreur réseau/lecture, on ne bloque pas (défaut permissif côté sécurité serveur).
    return false;
  }

  return false;
}
