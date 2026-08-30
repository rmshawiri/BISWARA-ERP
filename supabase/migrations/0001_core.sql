-- ============================================================
-- BISWARA ERP - Migration 0001 : Schéma cœur (Plateforme + RBAC)
-- ============================================================

-- Extension UUID
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ORGANISATIONS (tenants)
-- Chaque organisation est un tenant totalement isolé.
-- ------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slogan      text,
  sector      text not null default 'general',
  country     text not null default 'KM',
  city        text,
  logo_url    text,
  currency    text not null default 'KMF',
  plan        text not null default 'free',
  status      text not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROFILS (1:1 avec auth.users)
-- Un profil appartient soit à une organisation, soit - pour le
-- Super Admin - à aucune (organization_id null).
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  full_name       text not null,
  email           text,
  avatar_url      text,
  role            text not null default 'user' check (role in ('super_admin','admin','manager','user')),
  organization_id uuid references public.organizations(id) on delete set null,
  status          text not null default 'active' check (status in ('active','suspended')),
  phone           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_profiles_username on public.profiles(username);

-- ------------------------------------------------------------
-- RÔLES (par organisation)
-- ------------------------------------------------------------
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name        text not null,
  description text,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (organization_id, name)
);

-- ------------------------------------------------------------
-- COUPLAGE UTILISATEUR -> RÔLE
-- ------------------------------------------------------------
create table if not exists public.user_roles (
  user_id   uuid references public.profiles(id) on delete cascade,
  role_id   uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- ------------------------------------------------------------
-- PERMISSIONS ASSIGNÉES À UN RÔLE  (module, action)
-- ------------------------------------------------------------
create table if not exists public.permission_assignments (
  role_id uuid references public.roles(id) on delete cascade,
  module  text not null,
  action  text not null,
  primary key (role_id, module, action)
);

-- ------------------------------------------------------------
-- PERMISSIONS INDIVIDUELLES (complètent le rôle)
-- ------------------------------------------------------------
create table if not exists public.user_permissions (
  user_id uuid references public.profiles(id) on delete cascade,
  module  text not null,
  action  text not null,
  primary key (user_id, module, action)
);

-- ------------------------------------------------------------
-- CATALOGUE DES MODULES DE BASE (globaux, gérés par le Super Admin)
-- ------------------------------------------------------------
create table if not exists public.modules (
  id          text primary key,
  name        text not null,
  description text,
  category    text not null default 'base',
  default_plan text not null default 'free',
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ACTIVATION DES MODULES PAR ORGANISATION
-- ------------------------------------------------------------
create table if not exists public.organization_modules (
  organization_id uuid references public.organizations(id) on delete cascade,
  module_id       text references public.modules(id) on delete cascade,
  active          boolean not null default true,
  primary key (organization_id, module_id)
);

-- ------------------------------------------------------------
-- CATALOGUE DES ACTIVITÉS (métiers, plugins configurables)
-- ------------------------------------------------------------
create table if not exists public.activities (
  id           text primary key,
  name         text not null,
  description  text,
  category     text not null default 'general',
  default_plan text not null default 'standard',
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ACTIVATION DES ACTIVITÉS PAR ORGANISATION
-- ------------------------------------------------------------
create table if not exists public.organization_activities (
  organization_id uuid references public.organizations(id) on delete cascade,
  activity_id     text references public.activities(id) on delete cascade,
  active          boolean not null default true,
  installed       boolean not null default false,
  primary key (organization_id, activity_id)
);

-- ------------------------------------------------------------
-- ABONNEMENTS
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  plan            text not null default 'free',
  status          text not null default 'active' check (status in ('active','suspended','expired','trial')),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_subscriptions_org on public.subscriptions(organization_id);

-- ------------------------------------------------------------
-- JOURNAL D'AUDIT (Audit Engine - immuable)
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete set null,
  user_name      text,
  organization_id uuid references public.organizations(id) on delete set null,
  module         text not null,
  action         text not null,
  entity_type    text,
  entity_id      text,
  old_value      jsonb,
  new_value      jsonb,
  ip             text,
  level          text not null default 'info' check (level in ('info','warning','critical')),
  created_at     timestamptz not null default now()
);
create index if not exists idx_audit_org on public.audit_logs(organization_id, created_at);
create index if not exists idx_audit_user on public.audit_logs(user_id);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  module         text,
  title          text not null,
  body           text,
  priority       text not null default 'normal' check (priority in ('low','normal','important','critical')),
  is_read        boolean not null default false,
  link           text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
