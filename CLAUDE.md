# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MassasCRM** — a commercial management system for a food distributor (Distribuidora Mont Massas). Mobile-first PWA with Capacitor for Android. All UI text and domain concepts are in Brazilian Portuguese.

## Commands

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run test       # Vitest (jsdom, run once)
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase + TanStack React Query + Zustand

**Path alias:** `@/` maps to `./src/`

### Data Flow Pattern

```
Supabase (PostgreSQL)
  → src/services/*Service.ts   (raw queries, returns DB rows)
  → src/services/mappers.ts    (DB rows → Domain types, snake_case → camelCase)
  → src/hooks/use*.ts          (React Query hooks: queries + mutations, cache invalidation)
  → src/pages/*.tsx             (page components, lazy-loaded in App.tsx)
```

- **Two type systems:** `src/types/database.ts` (auto-generated Supabase types, snake_case) and `src/types/domain.ts` (app-facing interfaces, camelCase). Mappers bridge them.
- **Validation:** Zod schemas in `src/schemas/` used with react-hook-form.
- **Cart state:** Zustand store (`src/stores/useCartStore.ts`) with `persist` middleware for the sales flow.
- **Constants:** Enums, labels, colors, and config defaults live in `src/constants/index.ts`.

### Key Directories

- `src/components/ui/` — reusable UI primitives (Button, Modal, Card, Input, etc.)
- `src/components/features/` — feature-specific components (vendas, entregas, purchase-orders)
- `src/components/dashboard/` — dashboard widgets
- `src/components/contatos/` — contact-related components
- `src/components/layout/` — AppLayout, Header, PageContainer, FloatingDock

### Routing

HashRouter with lazy-loaded pages. All authenticated routes wrapped in `AuthGuard` + `AppLayout`. Login at `/login`.

### Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Database

Supabase project with migrations in `supabase/migrations/`. Key tables: `contatos`, `produtos`, `vendas`, `itens_venda`, `pagamentos_venda`, `purchase_orders`, `purchase_order_items`. To regenerate DB types, use the Supabase MCP tool `generate_typescript_types` and update `src/types/database.ts`.

### Testing

Vitest with jsdom environment. Setup file at `src/test/setup.ts`. Tests located at `src/services/__tests__/`. Run a single test file: `npx vitest run src/services/__tests__/mappers.spec.ts`
