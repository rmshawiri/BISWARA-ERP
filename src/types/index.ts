/**
 * Types partagés du cœur de BISWARA.
 */

import type { PermissionAction, PlanKey, RoleType } from "@/lib/constants";

/** Profil utilisateur (1:1 avec un compte Supabase Auth). */
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: RoleType;
  organizationId: string | null;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
}

/** Organisation (tenant). */
export interface Organization {
  id: string;
  name: string;
  slogan?: string | null;
  sector: string;
  country: string;
  city?: string | null;
  logoUrl?: string | null;
  currency: string;
  plan: PlanKey;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
}

/** Rôle + permissions résolues pour l'utilisateur connecté. */
export interface AuthzContext {
  user: UserProfile;
  organization: Organization | null;
  superAdmin: boolean;
  permissions: Map<string, Set<PermissionAction>>;
}

/** Clé de permission : module:action. */
export type PermissionKey = string;

/** Un événement d'audit (Audit Engine). */
export interface AuditEvent {
  id: string;
  userId: string;
  userName?: string | null;
  organizationId: string | null;
  module: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
  level: "info" | "warning" | "critical";
  createdAt: string;
}
