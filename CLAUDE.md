# CLAUDE.md

## Project: MassasCRM — Distribuidora Mont Massas

Sistema de gestão comercial para distribuidora de pão de queijo artesanal. Mobile-first PWA (Capacitor Android). UI em português brasileiro.

## Commands

```bash
npm run dev          # Dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run test         # Vitest (jsdom, run once)
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Supabase · TanStack React Query · Zustand · Framer Motion · Lucide Icons · react-hook-form + Zod

Path alias: `@/` → `./src/`

## Architecture

```
Supabase (PostgreSQL + RLS + Triggers + RPCs)
  → src/services/*Service.ts    (raw Supabase queries)
  → src/services/mappers.ts     (snake_case DB → camelCase Domain)
  → src/hooks/use*.ts            (React Query: queries + mutations)
  → src/pages/*.tsx              (lazy-loaded in App.tsx via HashRouter)
```

Two type systems bridged by mappers:
- `src/types/database.ts` — auto-generated Supabase types (snake_case)
- `src/types/domain.ts` — app-facing interfaces (camelCase)

## Key Directories

- `src/components/ui/` — primitives (Button, Modal, Card, Input, Select, Spinner)
- `src/components/features/` — vendas, entregas, purchase-orders
- `src/components/layout/` — AppLayout, Header, FloatingDock
- `src/schemas/` — Zod validation
- `src/stores/` — Zustand (useCartStore with persist)
- `src/constants/` — enums, labels, colors, config
- `supabase/migrations/` — DB migrations

## Pages (20 routes)

Dashboard · Contatos · ContatoDetalhe · NovaVenda · Vendas · VendaDetalhe · Ranking · Recompra · Configuracoes · Produtos · RelatorioFabrica · Estoque · Entregas · PedidosCompra · Menu · CatalogoPendentes · FluxoCaixa · ContasReceber · PlanoDeContas · LoginPage

## Database

Supabase project `herlvujykltxnwqmwmyx` — shared with catalogo-mont project.

Key tables: contatos, produtos, vendas, itens_venda, pagamentos_venda, purchase_orders, purchase_order_items, lancamentos_caixa, contas_caixa, plano_contas

Regenerate types: MCP `generate_typescript_types` → update `src/types/database.ts`

## Critical Rules

1. NEVER modify Supabase triggers/RPCs without diagnostic query first
2. Financial calculations must be validated at every layer (DB → service → mapper → component)
3. Field ownership: `subtitulo`, `categoria` only editable in internal system
4. PostgREST: `.limit()` ignored on DELETE (use subquery). Silent null on joins = unrecognized FK
5. Two-project architecture: changes to shared tables affect distribuidora AND catalogo-mont
6. Always run `npm run build` before considering any task complete

## Environment Variables

VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY

## Known Issues

**Brownfield Remediation:** See docs/brownfield-report-2026-03-13.md for diagnostic.
**Implementation Plan:** docs/superpowers/plans/2026-03-13-brownfield-remediation.md

Sprint 1 (Security): RLS user_metadata, SECURITY DEFINER views, always-true policies, mutable search_path
Sprint 2 (Performance): Bundle splitting, missing indexes, RLS initplan
Sprint 3 (Code Quality): Large components, console.logs, test coverage
