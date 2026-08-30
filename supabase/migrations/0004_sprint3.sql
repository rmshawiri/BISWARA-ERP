-- ============================================================
-- BISWARA ERP - Migration 0004 : Tables métier Sprint 3
--   Finance | Comptabilité | Achats
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + politiques
-- recréées (drop + create). Mot réservé "user" -> "user_meta".
-- ============================================================

-- ------------------------------------------------------------
-- FINANCE
-- ------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  code text,
  currency text not null default 'KMF',
  opening_balance numeric(14,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_accounts_org on public.accounts(organization_id);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  opened_by uuid,
  opened_at text,
  closed_at text,
  opening_balance numeric(14,2) not null default 0,
  theoretical_balance numeric(14,2) not null default 0,
  real_balance numeric(14,2) not null default 0,
  gap numeric(14,2) not null default 0,
  justification text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cash_sessions_org on public.cash_sessions(organization_id);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  direction text not null,
  amount numeric(14,2) not null default 0,
  method text not null default 'cash',
  reference text,
  date text,
  notes text,
  user_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_financial_transactions_org on public.financial_transactions(organization_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  planned numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_budgets_org on public.budgets(organization_id);

-- ------------------------------------------------------------
-- COMPTABILITÉ
-- ------------------------------------------------------------
create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number text not null,
  label text not null,
  class text,
  type text,
  parent_id uuid,
  active text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chart_of_accounts_org on public.chart_of_accounts(organization_id);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  active text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journals_org on public.journals(organization_id);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  journal_id uuid not null references public.journals(id) on delete cascade,
  number text not null,
  date text,
  label text not null,
  total_debit numeric(14,2) not null default 0,
  total_credit numeric(14,2) not null default 0,
  balanced text not null default 'yes',
  status text not null default 'draft',
  source_module text,
  user_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journal_entries_org on public.journal_entries(organization_id);

create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete cascade,
  label text not null,
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0
);
create index if not exists idx_journal_entry_lines_entry on public.journal_entry_lines(entry_id);

create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  start_date text,
  end_date text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fiscal_years_org on public.fiscal_years(organization_id);

-- ------------------------------------------------------------
-- ACHATS & FOURNISSEURS
-- ------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  reference text,
  contact text,
  phone text,
  email text,
  city text,
  payment_terms text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_suppliers_org on public.suppliers(organization_id);

create table if not exists public.purchase_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  type text not null,
  number text not null,
  date text,
  status text not null default 'draft',
  total numeric(14,2) not null default 0,
  user_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_purchase_documents_org on public.purchase_documents(organization_id);
create index if not exists idx_purchase_documents_org_type on public.purchase_documents(organization_id, type);

create table if not exists public.purchase_document_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.purchase_documents(id) on delete cascade,
  product_id uuid,
  description text not null,
  quantity numeric(14,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0
);
create index if not exists idx_purchase_lines_doc on public.purchase_document_lines(document_id);

create table if not exists public.purchase_validations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.purchase_documents(id) on delete cascade,
  step text not null,
  role text not null,
  validator_id uuid,
  decision text,
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_purchase_validations_doc on public.purchase_validations(document_id);

-- ------------------------------------------------------------
-- RLS : isolation par organisation (idempotent)
-- ------------------------------------------------------------
do $$
declare
  t text;
  pol text;
begin
  foreach t in array array[
    'accounts','cash_sessions','financial_transactions','budgets',
    'chart_of_accounts','journals','journal_entries','fiscal_years',
    'suppliers','purchase_documents'
  ] loop
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

-- journal_entry_lines via parent entry
create or replace function public.entry_org_id(entry_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.journal_entries where id = entry_id; $$;
alter table public.journal_entry_lines enable row level security;
drop policy if exists jel_select_org on public.journal_entry_lines;
create policy jel_select_org on public.journal_entry_lines for select using (public.entry_org_id(entry_id) = public.auth_organization_id());
drop policy if exists jel_insert_org on public.journal_entry_lines;
create policy jel_insert_org on public.journal_entry_lines for insert with check (public.entry_org_id(entry_id) = public.auth_organization_id());
drop policy if exists jel_update_org on public.journal_entry_lines;
create policy jel_update_org on public.journal_entry_lines for update using (public.entry_org_id(entry_id) = public.auth_organization_id());
drop policy if exists jel_delete_org on public.journal_entry_lines;
create policy jel_delete_org on public.journal_entry_lines for delete using (public.entry_org_id(entry_id) = public.auth_organization_id());

-- purchase_document_lines via parent document
create or replace function public.purchase_doc_org_id(doc_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.purchase_documents where id = doc_id; $$;
alter table public.purchase_document_lines enable row level security;
drop policy if exists pdl_select_org on public.purchase_document_lines;
create policy pdl_select_org on public.purchase_document_lines for select using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pdl_insert_org on public.purchase_document_lines;
create policy pdl_insert_org on public.purchase_document_lines for insert with check (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pdl_update_org on public.purchase_document_lines;
create policy pdl_update_org on public.purchase_document_lines for update using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pdl_delete_org on public.purchase_document_lines;
create policy pdl_delete_org on public.purchase_document_lines for delete using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());

-- purchase_validations via parent document (aucune colonne organization_id)
alter table public.purchase_validations enable row level security;
drop policy if exists pv_select_org on public.purchase_validations;
create policy pv_select_org on public.purchase_validations for select using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pv_insert_org on public.purchase_validations;
create policy pv_insert_org on public.purchase_validations for insert with check (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pv_update_org on public.purchase_validations;
create policy pv_update_org on public.purchase_validations for update using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
drop policy if exists pv_delete_org on public.purchase_validations;
create policy pv_delete_org on public.purchase_validations for delete using (public.purchase_doc_org_id(document_id) = public.auth_organization_id());
