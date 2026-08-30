# BISWARA ERP OS

> « Votre entreprise. Votre méthode. Votre BISWARA. »

Plateforme **ERP SaaS** moderne, modulaire, multi-tenant et sécurisée, développée par **MORA Shawiri**.

---

## Stack technique

- **Frontend / Backend** : Next.js (App Router) + React + TypeScript (strict)
- **UI** : Tailwind CSS + shadcn/ui (charte BISWARA)
- **Base de données** : Supabase (PostgreSQL) + Row Level Security
- **Authentification** : Supabase Auth (+ RBAC custom)
- **Accès données** : Drizzle ORM + supabase-js
- **Documents** : `@react-pdf/renderer` (Document Engine)
- **Déploiement** : Vercel + GitHub Actions (CI)

## Démarrage local

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env.local   # puis renseigner les clés Supabase

# 3. Appliquer le schéma (une fois) puis le seed
#    - Coller supabase/schema.sql dans le SQL Editor Supabase
node --env-file=.env.local supabase/scripts/apply-migrations.mjs
node --env-file=.env.local supabase/seed/seed.mjs

# 4. Lancer le serveur de dev
pnpm dev
```

## Commandes

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm start` | Serveur de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (tsc) |
| `pnpm test` | Tests unitaires (Vitest) |

## Sécurité des secrets

Les secrets (clés Supabase, tokens GitHub/Vercel, mots de passe) ne doivent **jamais** être écrits dans le code ni les fichiers versionnés. Ils vivent :

- localement dans `.env.local` (**exclu de Git** via `.gitignore`) ;
- dans les secrets des plateformes (Vercel, GitHub Actions, Supabase) ;
- `.env.example` est fourni avec des placeholders vides.

## Structure

```
src/
├── app/                 # Routes (public, auth, dashboard, admin)
├── modules/             # Modules métier (validation + service)
├── engines/             # Moteurs transverses (Audit, Notification, Document, Search)
├── components/          # Design System + composants fonctionnels
├── db/                  # Schémas Drizzle + client
├── server/              # Auth, RBAC, multi-tenant
├── lib/                 # Config, utilitaires
└── types/               # Types partagés
supabase/                # Migrations, seed, scripts
```

## Licence

Projet développé par **MORA Shawiri** — tous droits réservés.
