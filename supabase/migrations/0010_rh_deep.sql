-- ============================================================
-- BISWARA ERP - Migration 0010 : RH approfondi
--   contrats | présences/pointage | paie & bulletins
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + politiques RLS.
-- ============================================================

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  contract_type text not null default 'cdi', -- cdi | cdd | stage | freelance
  start_date text,
  end_date text,
  base_salary numeric(14,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contracts_org on public.contracts(organization_id);
create index if not exists idx_contracts_employee on public.contracts(employee_id);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date text,
  clock_in text,
  clock_out text,
  status text not null default 'present', -- present | late | absent | leave
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_attendance_org on public.attendance(organization_id);
create index if not exists idx_attendance_employee on public.attendance(employee_id);

create table if not exists public.payrolls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  period text not null, -- YYYY-MM
  base_salary numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  gross numeric(14,2) not null default 0,
  net numeric(14,2) not null default 0,
  status text not null default 'draft', -- draft | validated | paid
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payrolls_org on public.payrolls(organization_id);
create index if not exists idx_payrolls_employee on public.payrolls(employee_id);

-- RLS : isolation par organisation (idempotent)
do $$
declare
  t text;
  pol text;
begin
  foreach t in array array['contracts','attendance','payrolls'] loop
    execute format('alter table public.%I enable row level security', t);
    foreach pol in array array['select_org','insert_org','update_org','delete_org'] loop
      execute format('drop policy if exists %I on public.%I', t || '_' || pol, t);
    end loop;
    execute format('create policy %I on public.%I for select using (organization_id = public.auth_organization_id())', t || '_select_org', t);
    execute format('create policy %I on public.%I for insert with check (organization_id = public.auth_organization_id())', t || '_insert_org', t);
    execute format('create policy %I on public.%I for update using (organization_id = public.auth_organization_id()) with check (organization_id = public.auth_organization_id())', t || '_update_org', t);
    execute format('create policy %I on public.%I for delete using (organization_id = public.auth_organization_id())', t || '_delete_org', t);
  end loop;
end $$;
