-- BISWARA ERP — Journal des livraisons Webhooks.
-- Enregistre chaque envoi (heure, cible, méthode, statut succès/échec, code HTTP, durée).
create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  webhook_id uuid references public.webhooks(id) on delete set null,
  event text not null,
  url text not null,
  method text not null default 'POST',
  status text not null default 'success', -- success | failed
  status_code int,
  response text,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_org_idx on public.webhook_deliveries(organization_id);
create index if not exists webhook_deliveries_created_idx on public.webhook_deliveries(created_at desc);
