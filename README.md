# Alpha Cut Agency Platform

> Production platform for Alpha Cut Video Editing Agency, connecting the Public Marketing Website, Client Self-Service Portal, Internal Agency ERP Dashboard, and Telegram Mini App.

---

## 1. System Overview

Alpha Cut operates a unified TypeScript monorepo with four distinct client and operational surfaces:

- **Public Marketing Website (`/`)**: Client acquisition, interactive filterable portfolio, tiered service packages, founder bios (Amir & Aymen), lead inquiry form, and 4 mandatory legal compliance pages.
- **Client Web Portal (`/portal`)**: Client self-service portal featuring a 3-step brief submission wizard, order tracking, 1-tap proposal review/acceptance, deliverable video links (Frame.io/Drive), revision counter, cut approval, and 1–5 star reviews.
- **Internal Agency ERP Dashboard (`/admin`)**: Operations command center for `super_admin` (Amir & Aymen): Kanban/table project pipeline, dynamic proposal builder with custom revision allowances, client directory, manual multi-currency financial ledger (USD & ETB), and review curation.
- **Telegram Mini App (`@alpha_cut_bot`)**: Fast-action mobile workspace for clients built inside Telegram, strictly using Telegram native tokens (`--tg-theme-*`).
- **Telegram Bot (`@alpha_cut_bot`)**: Automated founder alerts, admin status commands (`/status`, `/projects`, `/deadlines`), and client deep-linking (`/start proposal_<id>`).

---

## 2. Technology Stack

- **Monorepo:** `pnpm` workspaces
- **Frontend Applications:** React 19, Vite, TypeScript, React Router, Tailwind CSS, shadcn/ui
- **Iconography Standard:** HugeIcons (strictly no emojis in Web and Mini App UI)
- **Backend API:** Node.js, Express, TypeScript, Zod validation
- **Database:** MongoDB Atlas (native driver with Zod runtime validation)
- **Email:** Resend
- **Media Previews:** Cloudinary
- **Telegram SDK:** `@telegram-apps/sdk-react` + Telegram Bot Webhook
- **Hosting:** Vercel (Frontends), Render (Backend API), Cloudflare (DNS/TLS)

---

## 3. Monorepo Structure

```
alpha-cut/
├── apps/
│   ├── web/               # Public site, Client Portal (/portal), and Admin ERP (/admin)
│   └── miniapp/           # Telegram Mini App (Client mobile workspace)
├── packages/
│   ├── api/               # Express backend service & Telegram webhook
│   ├── types/             # Shared TypeScript models & Zod validation schemas
│   ├── ui/                # Shared UI tokens, HugeIcons components & Centum primitives
│   └── config/            # Shared ESLint, Prettier, and Tailwind configurations
├── .env.example           # Environment template placeholders
├── LICENSE                # Proprietary license
└── pnpm-workspace.yaml    # Workspace configuration
```

---

## 4. Getting Started

### Prerequisites
- Node.js >= 20.x (v24.x recommended)
- `pnpm` >= 9.x
- MongoDB Atlas instance or local MongoDB

### Installation
```bash
# Clone the repository
git clone https://github.com/newt-ops/Alpha-Cut.git
cd Alpha-Cut

# Install all workspace dependencies
pnpm install

# Copy environment variables template
cp .env.example .env
# Edit .env with your credentials
```

### Development Commands
```bash
# Run all workspace applications concurrently
pnpm dev

# Run specific surface
pnpm --filter web dev        # Public Web, Client Portal & Admin ERP
pnpm --filter miniapp dev    # Telegram Mini App
pnpm --filter api dev        # Backend Express API

# Build for production
pnpm build

# Run linting and type checking
pnpm lint
pnpm typecheck

# Run test suites
pnpm test
```

---

## 5. Security & Privacy
- Zero-trust architecture: all protected endpoints enforce server-side JWT / session validation and RBAC.
- Telegram `initData` validated using SHA256 HMAC against `TELEGRAM_BOT_TOKEN`.
- As mandated by project rules, secrets (`.env`) and documentation files (`docs/`) are strictly untracked in Git.

---

## 6. License
Proprietary & Confidential. Copyright (c) 2026 Alpha Cut Video Editing Agency. All Rights Reserved.

