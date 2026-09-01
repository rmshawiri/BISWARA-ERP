-- ============================================================
-- BISWARA ERP - Migration 0015 : Centre de support (tickets)
--   table support_tickets + RLS par organisation.
-- IDEMPOTENT.
-- ============================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_support_tickets_org on public.support_tickets(organization_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);

-- RLS : isolation par organisation (idempotent)
do $$
declare
  t text;
  pol text;
begin
  t := 'support_tickets';
  execute format('alter table public.%I enable row level security', t);
  foreach pol in array array['select_org','insert_org','update_org','delete_org'] loop
    execute format('drop policy if exists %I on public.%I', t || '_' || pol, t);
  end loop;
  execute format('create policy %I on public.%I for select using (organization_id = public.auth_organization_id())', t || '_select_org', t);
  execute format('create policy %I on public.%I for insert with check (organization_id = public.auth_organization_id())', t || '_insert_org', t);
  execute format('create policy %I on public.%I for update using (organization_id = public.auth_organization_id()) with check (organization_id = public.auth_organization_id())', t || '_update_org', t);
  execute format('create policy %I on public.%I for delete using (organization_id = public.auth_organization_id())', t || '_delete_org', t);
end $$;
