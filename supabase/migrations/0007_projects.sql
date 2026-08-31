-- ============================================================
-- BISWARA ERP - Migration 0007 : Gestion de Projets & Tâches
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + politiques RLS.
-- ============================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  start_date text,
  due_date text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_org on public.projects(organization_id);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  progress integer not null default 0,
  weight integer not null default 1,
  due_date text,
  done boolean not null default false,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_project_tasks_org on public.project_tasks(organization_id);

do $$
declare
  t text;
  pol text;
begin
  foreach t in array array['projects','project_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    foreach pol in array array['select_org','insert_org','update_org','delete_org'] loop
      execute format('drop policy if exists %I on public.%I', t || '_' || pol, t);
    end loop;
    execute format('create policy %I on public.%I for select using (organization_id = public.auth_organization_id())', t || '_select_org', t);
    execute format('create policy %I on public.%I for insert with check (organization_id = public.auth_organization_id())', t || '_insert_org', t);
    execute format('create policy %I on public.%I for update using (organization_id = public.auth_organization_id())', t || '_update_org', t);
    execute format('create policy %I on public.%I for delete using (organization_id = public.auth_organization_id())', t || '_delete_org', t);
  end loop;
end $$;
