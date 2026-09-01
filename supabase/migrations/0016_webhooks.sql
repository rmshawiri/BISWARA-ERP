-- BISWARA ERP — Webhooks : colonnes complémentaires (conformité documentation).
-- Ajout idempotent pour le moteur d'envoi réel (méthode HTTP, nom, clé de signature,
-- suivi des livraisons).
alter table public.webhooks add column if not exists name text;
alter table public.webhooks add column if not exists method text not null default 'POST';
alter table public.webhooks add column if not exists secret_key text;
alter table public.webhooks add column if not exists last_delivery_at timestamptz;
alter table public.webhooks add column if not exists delivery_count int not null default 0;
