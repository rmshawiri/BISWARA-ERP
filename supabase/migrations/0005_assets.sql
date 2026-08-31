-- ============================================================
-- BISWARA ERP - Migration 0005 : Immobilisations & Actifs
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + politiques RLS.
-- ============================================================

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'equipment',
  reference text,
  acquisition_date text,
  cost numeric(14,2) not null default 0,
  residual_value numeric(14,2) not null default 0,
  useful_life numeric(6,1) not null default 5,
  method text not null default 'linear',
  location text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_assets_org on public.assets(organization_id);

do $$
declare
  t text;
  pol text;
begin
  foreach t in array array['assets'] loop
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
