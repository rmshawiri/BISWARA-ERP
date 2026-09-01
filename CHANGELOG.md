# CHANGELOG — BISWARA ERP OS

> Journal des évolutions de la plateforme (conforme au processus documenté).

## 0.1.0 — Socle (Sprints 1–4)
- Next.js 15 (App Router) + TypeScript strict, Tailwind + shadcn/ui, Supabase (PostgreSQL + RLS), Drizzle ORM.
- Landing Page premium, authentification Supabase, RBAC, audit engine, moteur de recherche, document (PDF) engine.
- Souscription WhatsApp, multi-tenant isolé.

## 0.2.0 — Phase 1 (Corrections critiques)
- TVA en % (serveur + PDF + tests), blocage des organisations suspendues/expirées,
  actions Super Admin (suspendre/réactiver/forfait/réinitialiser mdp), seed modules robuste,
  revue isolation `organization_id`, corrections migrations & CRM.

## 0.3.0 — Phase 2 (Fondations / moteurs)
- Subscription Engine (gating forfaits), Notification Engine (centre + canaux), Activity Engine,
  Backup Engine, RBAC UI + menu dynamique, onboarding, audit auth, Paramètres (activations),
  Search étendu, Document étendu, i18n (FR/EN/SW), PWA, SEO (sitemap/robots).

## 0.4.0 — Phase 3 (Fonctionnalités métier)
- Ventes (paiements/créances/statuts/conversion), Dashboard KPI réels, CRM (pipeline),
  Finance (caisse/budgets), Catalogue (référentiels), Stock (transferts), Projets (tâches),
  Achats (réception/approbation), Immobilisations (sortie/amortissement), Comptabilité
  (Grand Livre/Balance/États/exercices/contre-passation), RH (congés + contrats/présences/paie),
  Logistique (flotte), Rapports/BI, Portail Employé.
- Migrations : `0009` (logistique), `0010` (RH).

## 0.5.0 — Phase 4 (Automatisations inter-modules)
- Facture validée → stock + écriture ; paie/amortissement → écriture ; encaissement → trésorerie ;
  notifications déclenchées (vente, paiement, congé, stock faible, achat, exercice).

## 0.6.0 — Phase 5 (Fonctionnalités avancées)
- Multi-devise, modes de paiement configurables, clés API, webhooks, historique de recherche.
- Migration : `0011` (devises, paiements, API, webhooks).

## 0.7.0 — Phase 6 (Tests & sécurité)
- CI GitHub Actions (lint + typecheck + tests + build), tests unitaires (plans, i18n),
  tests multi-tenant + intégration, E2E Playwright, gestion d'erreur globale,
  rate-limit connexion, header HSTS.

## 0.8.0 — Phase 7 (Finition UX/UI)
- States vide uniformes (EmptyState), skeleton loading, données réelles (dashboard),
  boutons par permission, responsive mobile, accessibilité (labels/aria).

## 0.9.0 — Phase 8 (Préparation production)
- Endpoint de santé `/api/health`, conformité légale, documentation.
