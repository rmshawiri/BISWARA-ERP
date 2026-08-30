import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";
import { AuthzContext, Organization } from "@/types";
import { resolvePermissions } from "@/server/rbac";

const PROFILE_TABLE = "profiles";
const ORG_TABLE = "organizations";

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

  return profile as UserProfile;
}

/**
 * Exige un utilisateur connecté. Retourne la session Supabase + profil.
 * Redirige vers /login sinon.
 */
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

  return { supabase, user, profile: profile as UserProfile };
}

/**
 * Contexte de sécurité complet (authz) pour l'utilisateur connecté :
 * profil + organisation + permissions résolues.
 */
export async function getAuthzContext(): Promise<AuthzContext | null> {
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

  const profileData = profile as UserProfile;
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

  const permissions = await resolvePermissions(supabase, profileData);
  return { user: profileData, organization, superAdmin, permissions };
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
