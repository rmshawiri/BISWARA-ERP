-- ============================================================
-- BISWARA ERP - Migration 0003 : Tables métier (Sprint 2)
--   Catalogue | CRM | Gestion Commerciale | Stock
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + politiques
-- recréées (drop + create) pour être ré-exécutable sans erreur.
-- Note : le mot réservé "user" est renommé en "user_meta".
-- ============================================================

-- ------------------------------------------------------------
-- CATALOGUE
-- ------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_categories_org on public.product_categories(organization_id);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  symbol text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_units_org on public.units(organization_id);

create table if not exists public.taxes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  rate numeric(6,3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_taxes_org on public.taxes(organization_id);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_brands_org on public.brands(organization_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  reference text not null,
  barcode text,
  category_id uuid references public.product_categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  tax_id uuid references public.taxes(id) on delete set null,
  description text,
  purchase_price numeric(14,2) not null default 0,
  sale_price numeric(14,2) not null default 0,
  wholesale_price numeric(14,2),
  is_service boolean not null default false,
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_org on public.products(organization_id);
create unique index if not exists idx_products_org_ref on public.products(organization_id, reference);

-- ------------------------------------------------------------
-- CRM
-- ------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null default 'customer',
  company text,
  firstname text,
  lastname text not null,
  email text,
  phone text,
  whatsapp text,
  city text,
  country text not null default 'KM',
  sector text,
  source text,
  owner_user_id uuid,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_org on public.customers(organization_id);
create index if not exists idx_customers_org_type on public.customers(organization_id, type);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  title text not null,
  value numeric(14,2) not null default 0,
  probability numeric(5,2) not null default 0,
  stage text not null default 'prospect',
  expected_date text,
  owner_user_id uuid,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_opportunities_org on public.opportunities(organization_id);

-- ------------------------------------------------------------
-- GESTION COMMERCIALE
-- ------------------------------------------------------------
create table if not exists public.sales_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  type text not null,
  number text not null,
  date text,
  valid_until text,
  status text not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  due_date text,
  notes text,
  user_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sales_documents_org on public.sales_documents(organization_id);
create index if not exists idx_sales_documents_org_type on public.sales_documents(organization_id, type);

create table if not exists public.sales_document_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.sales_documents(id) on delete cascade,
  product_id uuid,
  description text not null,
  quantity numeric(14,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  tax_rate numeric(6,3) not null default 0,
  line_total numeric(14,2) not null default 0,
  sort_order numeric(6,0) not null default 0
);
create index if not exists idx_sales_lines_doc on public.sales_document_lines(document_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid references public.sales_documents(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(14,2) not null default 0,
  method text not null default 'cash',
  reference text,
  date text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_org on public.payments(organization_id);

-- ------------------------------------------------------------
-- STOCK & INVENTAIRE
-- ------------------------------------------------------------
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  manager_user_id uuid,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_warehouses_org on public.warehouses(organization_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  type text not null,
  quantity numeric(14,3) not null default 0,
  reference text,
  date text,
  notes text,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stock_movements_org on public.stock_movements(organization_id);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id);

create table if not exists public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  type text not null default 'full',
  status text not null default 'draft',
  started_at text,
  ended_at text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_counts_org on public.inventory_counts(organization_id);

-- ------------------------------------------------------------
-- RLS METIER : isolation par organisation (idempotent)
-- ------------------------------------------------------------
do $$
declare
  t text;
  pol text;
begin
  foreach t in array array[
    'product_categories','units','taxes','brands','products',
    'customers','opportunities',
    'sales_documents','payments',
    'warehouses','stock_movements','inventory_counts'
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

-- sales_document_lines scoping via parent document
create or replace function public.document_org_id(doc_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select organization_id from public.sales_documents where id = doc_id;
$$;

alter table public.sales_document_lines enable row level security;
drop policy if exists sales_lines_select_org on public.sales_document_lines;
create policy sales_lines_select_org on public.sales_document_lines
  for select using (public.document_org_id(document_id) = public.auth_organization_id());
drop policy if exists sales_lines_insert_org on public.sales_document_lines;
create policy sales_lines_insert_org on public.sales_document_lines
  for insert with check (public.document_org_id(document_id) = public.auth_organization_id());
drop policy if exists sales_lines_update_org on public.sales_document_lines;
create policy sales_lines_update_org on public.sales_document_lines
  for update using (public.document_org_id(document_id) = public.auth_organization_id());
drop policy if exists sales_lines_delete_org on public.sales_document_lines;
create policy sales_lines_delete_org on public.sales_document_lines
  for delete using (public.document_org_id(document_id) = public.auth_organization_id());
