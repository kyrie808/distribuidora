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

## Regras de Implementação

### Antes de qualquer implementação

1. Leia `docs/DESIGN_SYSTEM.md` — ele é a fonte da verdade de tokens, componentes e padrões visuais.
2. Leia os arquivos que serão modificados **antes** de editar. Nunca edite código que não foi lido.
3. Nunca chame Supabase diretamente de um componente. Sempre: `component → hook → service → Supabase`.
4. Nunca misture tipos DB (snake_case, `database.ts`) com tipos Domain (camelCase, `domain.ts`) em componentes.
5. Toda nova página com `showBack` **deve** ter `centerTitle` no Header.

### Diagnóstico obrigatório antes de tocar em

- **Triggers/RPCs do Supabase**: rode query diagnóstica primeiro, confirme o estado atual.
- **Tabelas compartilhadas** (`contatos`, `produtos`, `cat_pedidos`, `configuracoes`): verifique impacto no projeto `catalogo-mont`.
- **Cálculos financeiros**: valide em todas as camadas — DB → service → mapper → componente.
- **Componentes grandes** (>200 linhas): leia o arquivo inteiro antes de propor mudanças.

### O que é proibido (com exemplos)

| ❌ Proibido | ✅ Correto |
|---|---|
| `text-zinc-*`, `text-slate-*` | `text-muted-foreground` ou `text-gray-*` |
| `font-black` | `font-bold` |
| `rounded-3xl` em cards | `rounded-xl` |
| `bg-emerald-50 text-emerald-700` (status) | `bg-success/10 text-success` |
| `bg-red-50 text-red-600` (status) | `bg-destructive/10 text-destructive` |
| `bg-orange-100 text-orange-700` (status) | `bg-warning/10 text-warning` |
| `bg-blue-50 text-blue-700` (info box) | `bg-primary/10 text-primary` |
| `border-slate-*`, `border-gray-100 dark:border-gray-700` | `border-border` |
| `hover:bg-gray-50 dark:hover:bg-gray-800` | `hover:bg-muted` |
| `<button className="bg-primary ...">` (ação primária) | `<Button variant="primary">` |
| `<span className="bg-green-100 ...">Status</span>` | `<Badge variant="success">Status</Badge>` |
| `new Intl.NumberFormat(...).format(v)` | `formatCurrency(v)` |
| `new Date(d).toLocaleDateString('pt-BR')` | `formatDate(d)` |
| `` `https://wa.me/55${phone}` `` | `getWhatsAppLink(phone)` |
| `console.log/error/warn` em produção | Remova — use `toast.error(msg)` |
| Variáveis `_nome` em TSX (exceto `catch`) | Renomeie para `nome` sem `_` |
| Page sem `pb-24` no container principal | Adicione `pb-24` (evita sobreposição do BottomNav) |

### Checklist obrigatório antes de qualquer PR

**Build**
- [ ] `npm run build` passa sem erros de TypeScript
- [ ] `npm run lint` passa sem warnings
- [ ] Nenhum `console.log`, `console.error`, `console.warn` no código

**Design System**
- [ ] Nenhuma cor hardcoded para fins semânticos (`text-zinc-*`, `text-slate-*`, `bg-emerald-*` como status)
- [ ] Todos os botões de ação usam `<Button variant="...">` — nenhum `<button>` raw com `bg-*`
- [ ] Todos os status indicators usam `<Badge variant="...">` — nenhum `<span>` com cores inline
- [ ] Todas as bordas usam `border-border` — nenhum `border-gray-*` ou `border-slate-*`
- [ ] Hovers de itens interativos usam `hover:bg-muted`

**Header e Navegação**
- [ ] Toda página com `showBack` tem `centerTitle`
- [ ] Páginas de nível 1 (top-level) usam `showMenu` + `onMenuClick={openDrawer}`

**Acessibilidade**
- [ ] Todo `<button>` icon-only tem `aria-label`
- [ ] Todos os `<input>` têm `<label>` ou `aria-label`
- [ ] Todos os elementos interativos têm min 44×44px de área de toque

**Dados**
- [ ] Todo valor monetário usa `formatCurrency()`
- [ ] Toda data usa `formatDate()` / `formatDateTime()` / `formatRelativeDate()`
- [ ] Todo link WhatsApp usa `getWhatsAppLink()`

**Conteúdo**
- [ ] Página com lista tem `pb-24` no container principal
- [ ] Toda lista tem `<EmptyState>` configurado
- [ ] Toda operação assíncrona tem feedback de loading
- [ ] Toda operação tem feedback de erro (toast ou error state inline)

## Known Issues

**Brownfield Remediation:** See docs/brownfield-report-2026-03-13.md for diagnostic.
**Implementation Plan:** docs/superpowers/plans/2026-03-13-brownfield-remediation.md

Sprint 1 (Security): RLS user_metadata, SECURITY DEFINER views, always-true policies, mutable search_path
Sprint 2 (Performance): Bundle splitting, missing indexes, RLS initplan
Sprint 3 (Code Quality): Large components, console.logs, test coverage
