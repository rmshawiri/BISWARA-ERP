-- ============================================================
-- BISWARA ERP - Migration 0013 : Abonnements — essai / remise
--   Ajoute la date de fin d'essai et le pourcentage de remise
--   par abonnement (Super Admin).
-- IDEMPOTENT : add column if not exists.
-- ============================================================

alter table public.subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.subscriptions add column if not exists discount_percent integer not null default 0;

-- Bornage de la remise entre 0 et 100 (idempotent)
alter table public.subscriptions drop constraint if exists subscriptions_discount_percent_check;
alter table public.subscriptions add constraint subscriptions_discount_percent_check check (discount_percent >= 0 and discount_percent <= 100);
