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
-- ============================================================
-- BISWARA ERP - Migration 0002 : RLS & isolation multi-tenant
-- ============================================================

-- Fonction utilitaire : retourne l'organization_id de l'utilisateur connecté.
create or replace function public.auth_organization_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- Met à jour automatiquement updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_org_updated on public.organizations;
create trigger trg_org_updated before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_roles_updated on public.roles;
create trigger trg_roles_updated before update on public.roles
  for each row execute function public.set_updated_at();

-- ============================================================
-- PROFILES
-- Un utilisateur lit/modifie SON profil.
-- Le Super Admin est géré via service_role (bypass RLS).
-- ============================================================
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- ORGANIZATIONS
-- Un membre de l'organisation peut lire son organisation.
-- ============================================================
alter table public.organizations enable row level security;

create policy "organizations_select_member" on public.organizations
  for select using (id = public.auth_organization_id());

-- ============================================================
-- ROLES & permissions (scopés à l'organisation)
-- ============================================================
alter table public.roles enable row level security;
create policy "roles_select_org" on public.roles
  for select using (organization_id = public.auth_organization_id());
create policy "roles_insert_org" on public.roles
  for insert with check (organization_id = public.auth_organization_id());
create policy "roles_update_org" on public.roles
  for update using (organization_id = public.auth_organization_id());
create policy "roles_delete_org" on public.roles
  for delete using (organization_id = public.auth_organization_id());

alter table public.user_roles enable row level security;
create policy "user_roles_select_org" on public.user_roles
  for select using (exists (
    select 1 from public.profiles p
    where p.id = user_roles.user_id and p.organization_id = public.auth_organization_id()
  ));
create policy "user_roles_manage_org" on public.user_roles
  for all using (
    exists (select 1 from public.roles r where r.id = user_roles.role_id and r.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.roles r where r.id = user_roles.role_id and r.organization_id = public.auth_organization_id())
  );

alter table public.permission_assignments enable row level security;
create policy "perm_assignments_select_org" on public.permission_assignments
  for select using (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  );
create policy "perm_assignments_manage_org" on public.permission_assignments
  for all using (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  );

alter table public.user_permissions enable row level security;
create policy "user_permissions_select_own" on public.user_permissions
  for select using (user_id = auth.uid());
create policy "user_permissions_manage_org" on public.user_permissions
  for all using (
    exists (select 1 from public.profiles p where p.id = user_permissions.user_id and p.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.profiles p where p.id = user_permissions.user_id and p.organization_id = public.auth_organization_id())
  );

-- ============================================================
-- MODULES & ACTIVITIES (catalogue global, lecture authentifiée,
-- écriture réservée au Super Admin via service_role)
-- ============================================================
alter table public.modules enable row level security;
create policy "modules_select_auth" on public.modules
  for select using (auth.role() = 'authenticated');

alter table public.activities enable row level security;
create policy "activities_select_auth" on public.activities
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- ORGANIZATION BLOCKS (modules / activités activés par l'org)
-- ============================================================
alter table public.organization_modules enable row level security;
create policy "org_modules_select_member" on public.organization_modules
  for select using (organization_id = public.auth_organization_id());
create policy "org_modules_manage_member" on public.organization_modules
  for all using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

alter table public.organization_activities enable row level security;
create policy "org_activities_select_member" on public.organization_activities
  for select using (organization_id = public.auth_organization_id());
create policy "org_activities_manage_member" on public.organization_activities
  for all using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_member" on public.subscriptions
  for select using (organization_id = public.auth_organization_id());

-- ============================================================
-- AUDIT LOGS
-- Une organisation lit uniquement ses propres journaux.
-- L'insertion se fait via service_role (déclencheurs serveur).
-- ============================================================
alter table public.audit_logs enable row level security;
create policy "audit_select_org" on public.audit_logs
  for select using (organization_id = public.auth_organization_id());
create policy "audit_select_superadmin" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());
create policy "notifications_insert_own" on public.notifications
  for insert with check (user_id = auth.uid());

-- ============================================================
-- PROFILS : autoriser l'insertion lors de l'inscription.
-- L'insertion initiale est faite côté serveur (service_role).
-- On autorise aussi l'utilisateur à lire le sien (déjà couvert).
-- ============================================================
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
