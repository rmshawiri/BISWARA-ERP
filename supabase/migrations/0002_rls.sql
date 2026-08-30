-- ============================================================
-- BISWARA ERP - Migration 0002 : RLS & isolation multi-tenant
-- IDEMPOTENT : politique recréée (drop + create) pour être
-- ré-exécutable sans erreur "policy already exists".
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
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
alter table public.organizations enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select using (id = public.auth_organization_id());

-- ============================================================
-- ROLES & permissions
-- ============================================================
alter table public.roles enable row level security;
drop policy if exists roles_select_org on public.roles;
create policy roles_select_org on public.roles
  for select using (organization_id = public.auth_organization_id());
drop policy if exists roles_insert_org on public.roles;
create policy roles_insert_org on public.roles
  for insert with check (organization_id = public.auth_organization_id());
drop policy if exists roles_update_org on public.roles;
create policy roles_update_org on public.roles
  for update using (organization_id = public.auth_organization_id());
drop policy if exists roles_delete_org on public.roles;
create policy roles_delete_org on public.roles
  for delete using (organization_id = public.auth_organization_id());

alter table public.user_roles enable row level security;
drop policy if exists user_roles_select_org on public.user_roles;
create policy user_roles_select_org on public.user_roles
  for select using (exists (
    select 1 from public.profiles p
    where p.id = user_roles.user_id and p.organization_id = public.auth_organization_id()
  ));
drop policy if exists user_roles_manage_org on public.user_roles;
create policy user_roles_manage_org on public.user_roles
  for all using (
    exists (select 1 from public.roles r where r.id = user_roles.role_id and r.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.roles r where r.id = user_roles.role_id and r.organization_id = public.auth_organization_id())
  );

alter table public.permission_assignments enable row level security;
drop policy if exists perm_assignments_select_org on public.permission_assignments;
create policy perm_assignments_select_org on public.permission_assignments
  for select using (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  );
drop policy if exists perm_assignments_manage_org on public.permission_assignments;
create policy perm_assignments_manage_org on public.permission_assignments
  for all using (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.roles r where r.id = permission_assignments.role_id and r.organization_id = public.auth_organization_id())
  );

alter table public.user_permissions enable row level security;
drop policy if exists user_permissions_select_own on public.user_permissions;
create policy user_permissions_select_own on public.user_permissions
  for select using (user_id = auth.uid());
drop policy if exists user_permissions_manage_org on public.user_permissions;
create policy user_permissions_manage_org on public.user_permissions
  for all using (
    exists (select 1 from public.profiles p where p.id = user_permissions.user_id and p.organization_id = public.auth_organization_id())
  ) with check (
    exists (select 1 from public.profiles p where p.id = user_permissions.user_id and p.organization_id = public.auth_organization_id())
  );

-- ============================================================
-- MODULES & ACTIVITIES (catalogue global, lecture authentifiée)
-- ============================================================
alter table public.modules enable row level security;
drop policy if exists modules_select_auth on public.modules;
create policy modules_select_auth on public.modules
  for select using (auth.role() = 'authenticated');

alter table public.activities enable row level security;
drop policy if exists activities_select_auth on public.activities;
create policy activities_select_auth on public.activities
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- ORGANIZATION BLOCKS
-- ============================================================
alter table public.organization_modules enable row level security;
drop policy if exists org_modules_select_member on public.organization_modules;
create policy org_modules_select_member on public.organization_modules
  for select using (organization_id = public.auth_organization_id());
drop policy if exists org_modules_manage_member on public.organization_modules;
create policy org_modules_manage_member on public.organization_modules
  for all using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

alter table public.organization_activities enable row level security;
drop policy if exists org_activities_select_member on public.organization_activities;
create policy org_activities_select_member on public.organization_activities
  for select using (organization_id = public.auth_organization_id());
drop policy if exists org_activities_manage_member on public.organization_activities;
create policy org_activities_manage_member on public.organization_activities
  for all using (organization_id = public.auth_organization_id())
  with check (organization_id = public.auth_organization_id());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_member on public.subscriptions;
create policy subscriptions_select_member on public.subscriptions
  for select using (organization_id = public.auth_organization_id());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
alter table public.audit_logs enable row level security;
drop policy if exists audit_select_org on public.audit_logs;
create policy audit_select_org on public.audit_logs
  for select using (organization_id = public.auth_organization_id());
drop policy if exists audit_select_superadmin on public.audit_logs;
create policy audit_select_superadmin on public.audit_logs
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
alter table public.notifications enable row level security;
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());
drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own on public.notifications
  for insert with check (user_id = auth.uid());
