-- BISWARA ERP — Avances sur salaire (Portail Employé, self-service).
create table if not exists public.salary_advances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  reason text,
  status text not null default 'pending', -- pending | approved | rejected | paid
  requested_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists salary_advances_org_idx on public.salary_advances(organization_id);
create index if not exists salary_advances_emp_idx on public.salary_advances(employee_id);
