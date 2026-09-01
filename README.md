# BISWARA ERP OS

> « Votre entreprise. Votre méthode. Votre BISWARA. »
> *"Your business. Your method. Your BISWARA."*

**BISWARA ERP OS** is a **modular, multi-tenant, secure SaaS ERP** that lets an organisation manage all of its operations — commercial, financial, HR, logistics and day-to-day — from **one modern platform**.

Developed by **MORA Shawiri** · Live at **https://biswara-erp.vercel.app**

---

## ✨ What is BISWARA?

A single cloud platform that replaces scattered spreadsheets and disconnected tools. Every organisation gets a **fully isolated** workspace, and enables **only the modules it needs** — without ever losing its data.

**Built for African & Indian-Ocean businesses**: currency **KMF**, **mobile money** (Mvola, Holo, Wakati), local industries.

### Modules
- **Management** : CRM · Product & Service Catalog · Sales Management (quotes, orders, invoices, payments)
- **Logistics** : Stock & Inventory · Purchasing & Suppliers · Logistics & Transport (fleet, routes, fuel)
- **Finance** : Finance & Treasury · Accounting (General Ledger, Balance Sheet, Financial Statements) · Fixed Assets
- **HR** : Human Resources (contracts, leave, attendance, payroll) · Employee Portal
- **Projects** : Project & Task Management
- **Cross-cutting** : Dashboard & KPIs · Reports · Notifications · Settings · Administration & Permissions

### Cross-cutting engines
Authentication & Permissions · Audit trail · Notifications (in-app, email, WhatsApp) · Document engine (PDF/CSV) · Global search · Workflow · Backup · Subscription (plan limits)

### Automation
Validating an invoice can automatically **decrease stock**, **create the accounting entry**, **update treasury** and **notify** the right people. A payslip is generated in one click; a payment updates the invoice.

### Plans
| Plan | Price | Highlights |
|---|---|---|
| **Free** | 0 KMF/mo | Base modules, 1 user |
| **Standard** | 5 000 KMF/mo | All base modules, CRM & sales, stock, PDF — 5 users |
| **Business** (recommended) | 10 000 KMF/mo | + Accounting, Finance, HR & Payroll, Purchasing — 20 users |
| **VIP** | 20 000 KMF/mo | All modules + activities, logistics, projects, API — unlimited |

> Subscribe via **WhatsApp** (pre-filled message), pay by mobile money or bank transfer.

---

## 🧰 Tech stack

- **Frontend / Backend** : Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **UI** : Tailwind CSS + shadcn/ui (BISWARA design system), responsive, PWA, i18n (FR/EN/SW)
- **Database** : Supabase (PostgreSQL) + **Row Level Security** (multi-tenant)
- **Auth** : Supabase Auth (+ custom RBAC)
- **Data access** : Drizzle ORM + Supabase / node-postgres
- **Documents** : `@react-pdf/renderer` (Document Engine)
- **Deployment** : Vercel (auto-deploy from `main`) + **GitHub Actions** (CI)

---

## 🗄️ Migrations

| File | Purpose |
|---|---|
| `supabase/migrations/0001–0008` | Core schema + RLS + business tables |
| `supabase/migrations/0009` | Logistics extension (drivers, routes, fuel, maintenance, incidents) |
| `supabase/migrations/0010` | HR deep (contracts, attendance, payroll) |
| `supabase/migrations/0011` | Advanced (currencies, payment methods, API keys, webhooks) |

---

## 🚀 Getting started (local)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local   # fill in Supabase keys

# 3. Apply the schema once, then seed
node --env-file=.env.local supabase/scripts/apply-migrations.mjs
node --env-file=.env.local supabase/seed/seed.mjs

# 4. Start the dev server
pnpm dev
```

> The app also generates **demo data** for a newly created organisation automatically.

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (tsc) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |

---

## 🔐 Security

- Secrets (Supabase, GitHub/Vercel tokens, passwords) are **never** committed (`.env.*` is git-ignored).
- Multi-tenant isolation via **RLS** + `organization_id` filters (audited).
- RBAC (Super Admin / org Admin / roles + individual permissions, default **deny**).
- Global error boundary, **login rate-limit**, security headers (**HSTS**, X-Frame, nosniff…).
- **CI** runs lint + typecheck + tests + build on every push/PR.

---

## 📁 Project structure

```
src/
├── app/                 # Routes (public, auth, dashboard, admin, api)
├── modules/             # Business modules (validation + service + actions)
├── engines/             # Cross-cutting engines (Audit, Notification, Document, Search, Workflow, Backup, Subscription)
├── components/          # Design system + functional components
├── db/                  # Drizzle schemas + client
├── server/              # Auth, RBAC, multi-tenant
├── lib/                 # Config, utils, i18n
└── types/               # Shared types
supabase/                # Migrations, seed, scripts
e2e/                     # Playwright E2E tests
```

---

## 🩺 Health / monitoring

`GET /api/health` — returns `{ status: "ok" }` when the database connection works (used for uptime monitoring).

---

## 📝 License

Developed by **MORA Shawiri** — all rights reserved.

> **BISWARA ERP OS** — "The Optimal Choice for your performance." · « Le Choix Optimal pour votre performance. »
