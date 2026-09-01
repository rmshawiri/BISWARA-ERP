-- ============================================================
-- BISWARA ERP - Migration 0012 : Paramètres système plateforme
--   table clé/valeur globale (Super Admin uniquement)
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + RLS.
-- ============================================================

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

-- Lecture : utilisateurs authentifiés (nécessaire pour afficher)
create policy "system_settings_select_auth" on public.system_settings
  for select using (auth.role() = 'authenticated');

-- Écriture : réservée au Super Admin (via service_role côté serveur)
create policy "system_settings_insert_superadmin" on public.system_settings
  for insert with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'
  ));
create policy "system_settings_update_superadmin" on public.system_settings
  for update using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'
  ));

-- Valeurs par défaut au démarrage
insert into public.system_settings (key, value)
values
  ('platform_email', 'contact@morashawiri.com'),
  ('platform_whatsapp', '+2694306306'),
  ('platform_site', 'www.morashawiri.com'),
  ('platform_address', 'Moroni Oasis, route des puffins')
on conflict (key) do nothing;
