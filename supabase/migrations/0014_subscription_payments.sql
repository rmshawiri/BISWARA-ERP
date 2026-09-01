-- ============================================================
-- BISWARA ERP - Migration 0014 : Paiements d'abonnements
--   Table des paiements d'abonnements plateforme (Super Admin)
--   + clés système par défaut (maintenance / environnement).
-- IDEMPOTENT : create table if not exists + on conflict do nothing.
-- ============================================================

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  amount integer not null default 0,
  currency text not null default 'KMF',
  method text not null default 'cash',
  status text not null default 'pending',
  reference text,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subpay_org on public.subscription_payments(organization_id);
create index if not exists idx_subpay_status on public.subscription_payments(status);

-- Accès réservé au Super Admin : RLS activé, aucune politique par organisation
-- (seul le service_role / client Drizzle admin peut lire/écrire).
alter table public.subscription_payments enable row level security;

-- Clés système par défaut (idempotent)
insert into public.system_settings (key, value) values ('maintenance_enabled','false') on conflict (key) do nothing;
insert into public.system_settings (key, value) values ('platform_environment','production') on conflict (key) do nothing;
insert into public.system_settings (key, value) values ('platform_version','1.0.0') on conflict (key) do nothing;
