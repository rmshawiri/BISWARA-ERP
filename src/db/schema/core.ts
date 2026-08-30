/**
 * Schéma cœur BISWARA (Plateforme + RBAC + abonnements + audit + notifications).
 * Miroir typé des migrations SQL (0001_core.sql / 0002_rls.sql).
 */
import {
  pgTable,
  uniqueIndex,
  index,
  text,
  uuid,
  jsonb,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status, isActive, sortOrder } from "./helpers";

// ------------------------------------------------------------
// ORGANISATIONS (tenants)
// ------------------------------------------------------------
export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slogan: text("slogan"),
  sector: text("sector").notNull().default("general"),
  country: text("country").notNull().default("KM"),
  city: text("city"),
  logoUrl: text("logo_url"),
  currency: text("currency").notNull().default("KMF"),
  plan: text("plan").notNull().default("free"),
  status: status("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ------------------------------------------------------------
// PROFILS (1:1 avec auth.users)
// ------------------------------------------------------------
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    username: text("username").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("user"),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    status: status("active"),
    phone: text("phone"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("profiles_username_idx").on(t.username),
    index("profiles_org_idx").on(t.organizationId),
  ]
);

// ------------------------------------------------------------
// RÔLES & PERMISSIONS
// ------------------------------------------------------------
export const roles = pgTable(
  "roles",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("roles_org_name_idx").on(t.organizationId, t.name)]
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const permissionAssignments = pgTable(
  "permission_assignments",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    action: text("action").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.module, t.action] })]
);

export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    action: text("action").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.module, t.action] })]
);

// ------------------------------------------------------------
// CATALOGUE MODULES / ACTIVITÉS (globaux) + activation par org
// ------------------------------------------------------------
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("base"),
  defaultPlan: text("default_plan").notNull().default("free"),
  sortOrder: sortOrder(),
  active: isActive(),
  createdAt: createdAt(),
});

export const organizationModules = pgTable(
  "organization_modules",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.moduleId] })]
);

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  defaultPlan: text("default_plan").notNull().default("standard"),
  sortOrder: sortOrder(),
  active: isActive(),
  createdAt: createdAt(),
});

export const organizationActivities = pgTable(
  "organization_activities",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    installed: boolean("installed").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.activityId] })]
);

// ------------------------------------------------------------
// ABONNEMENTS
// ------------------------------------------------------------
export const subscriptions = pgTable("subscriptions", {
  id: id(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ------------------------------------------------------------
// AUDIT LOGS (immuable par convention applicative)
// ------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    userName: text("user_name"),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    module: text("module").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    ip: text("ip"),
    level: text("level").notNull().default("info"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_org_created_idx").on(t.organizationId, t.createdAt)]
);

// ------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    module: text("module"),
    title: text("title").notNull(),
    body: text("body"),
    priority: text("priority").notNull().default("normal"),
    isRead: boolean("is_read").notNull().default(false),
    link: text("link"),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.isRead)]
);

export type Organization = typeof organizations.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
