# SETUP COMPLETO — Distribuidora Mont Massas
# ============================================================
# Cole este prompt no Claude Code OU no Antigravity IDE (com MCP filesystem)
# O agente vai executar as 3 etapas em sequência.
# ============================================================

Preciso que você execute o setup completo do repositório.
São 3 etapas sequenciais. Execute cada uma completamente antes de ir para a próxima.
Confirme o resultado de cada etapa.

---

## ETAPA 1 — LIMPEZA TOTAL

Delete completamente os seguintes diretórios:
- `.aios-core/` (synkrai-aios inteiro — ~12MB, ~1039 arquivos)
- `.agent/` (workflows legados)
- `.agents/` (rules legados)
- `.antigravity/agents/` (agentes legados — serão recriados na Etapa 3)

Delete os seguintes arquivos da raiz do projeto:
- `AGENTS.md`
- `ARCHITECTURE_AUDIT.md`
- `.mcp.json` ⚠️ CONTÉM TOKEN EXPOSTO — deletar do repo, recriar local depois
- `build-errors.txt`, `build-output.txt`, `cashflow_test_output.txt`
- `debug_raw_output.txt`, `diag.js`, `diag_out.txt`
- `duplicates_report.txt`, `latest_groq_response.txt`, `link_out.txt`
- `lint-results.txt`, `sales_dump.json`, `test_api.py`, `requirements.txt`
- `ts_errors.txt`, `ts_errors_final.txt`, `ts_errors_final_utf8.txt`
- `ts_errors_full.txt`, `ts_errors_utf8.txt`, `ts_errors_v2.txt`
- `ts_errors_v2_utf8.txt`, `ts_errors_v3.txt`, `ts_errors_v3_utf8.txt`
- `todos_fiados.md`, `analise_fiados.md`

Adicione ao `.gitignore` (se não existirem ainda):
```
# Agent configs com tokens
.mcp.json
.env

# Debug/output temporários
*.log
*_output.txt
*_errors*.txt
lint-results.txt
diag_out.txt
```

Confirme o que foi removido e espaço liberado.

---

## ETAPA 2 — INSTALAR SKILLS

### 2a. Skills via npx (Vercel CLI)

Execute cada comando em sequência. Se `npx skills` falhar (rede bloqueada, etc), clone o repositório manualmente e copie a pasta da skill.

```bash
# 1. Meta-skill: permite o agente buscar e instalar novas skills sob demanda
npx skills add vercel-labs/skills --skill find-skills

# 2. Frontend design (pbakaus/impeccable) — anti-AI-slop, philosophy-driven
npx skills add pbakaus/impeccable --skill frontend-design

# 3. React best practices (Vercel Labs oficial)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices

# 4. Supabase Postgres best practices (Supabase oficial)
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices

# 5. UI/UX Pro Max — banco de dados de design completo (50+ estilos, 97 paletas, 57 fonts)
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max
```

Se algum `npx skills add` falhar por rede, faça o fallback manual:
```bash
cd /tmp
git clone https://github.com/<owner>/<repo>.git
cp -r /tmp/<repo>/.claude/skills/<skill-name> .claude/skills/<skill-name>
rm -rf /tmp/<repo>
```

### 2b. Skills customizadas (criar manualmente)

Crie os seguintes arquivos:

**Arquivo: `.claude/skills/fix-and-deploy/SKILL.md`**

```markdown
---
name: fix-and-deploy
description: Fix a bug or error and verify the build passes. Use when user says "fix", "bug", "erro", "corrigir", "deploy", or "build quebrado".
allowed-tools: Read, Write, Bash, Grep
---

# Fix & Deploy

You are fixing a bug in MassasCRM (React 19 + TypeScript + Vite + Supabase).

## Process

1. **Identify** — Read the error message or file mentioned. Use Grep if needed.
2. **Diagnose** — Find the root cause. Check types in `src/types/domain.ts` and `src/types/database.ts` if type errors.
3. **Fix** — Apply the minimal change. Do NOT refactor unrelated code.
4. **Verify** — Run `npm run build`. If it passes, done. If not, fix the new error.
5. **Report** — Show what changed in 3 lines max.

## Rules

- Mapper changes go in `src/services/mappers.ts`
- Type changes go in `src/types/domain.ts` (app) or `src/types/database.ts` (DB)
- Never touch Supabase triggers without reading them first via MCP
- Run `npm run build` as the final step, always
```

**Arquivo: `.claude/skills/supabase-distribuidora/SKILL.md`**

```markdown
---
name: supabase-distribuidora
description: Supabase database operations for this project. Use when working with database, tables, triggers, RPC, migrations, or types.
allowed-tools: Read, Write, Bash, Grep
---

# Supabase Expert — MassasCRM

Project ID: herlvujykltxnwqmwmyx (shared between distribuidora + catalogo-mont)

## Before ANY database change

1. Run a diagnostic SELECT to see current state
2. For triggers: `SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname LIKE '%pattern%';`
3. For RPCs: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
4. Explain what you will change and wait for approval

## PostgREST Gotchas

- `.limit()` is IGNORED on DELETE → use subquery approach
- Silent null on joins = FK not recognized → `NOTIFY pgrst, 'reload schema'`
- After ANY schema change: `NOTIFY pgrst, 'reload schema'`

## Type Regeneration Flow

1. Make DB change
2. Use MCP `generate_typescript_types` (or Supabase CLI)
3. Update `src/types/database.ts`
4. Check if `src/types/domain.ts` needs updates
5. Check if `src/services/mappers.ts` needs updates
6. Run `npm run build`

## Two-Project Architecture

This Supabase is shared with catalogo-mont.
- Tables with `cat_` prefix = catalog project
- Field ownership: `subtitulo`, `categoria` = only internal system edits
- `visivel_catalogo` controls catalog visibility (separate from `ativo`)
- Image tables: `sis_imagens_produto` (internal) + `cat_imagens_produto` (catalog)

## Key Tables

contatos, produtos, vendas, itens_venda, pagamentos_venda, purchase_orders, purchase_order_items, lancamentos_caixa, contas_caixa, plano_contas
```

**Arquivo: `.claude/skills/review-compact/SKILL.md`**

```markdown
---
name: review-compact
description: Quick code review that saves tokens. Use when user says "review", "revisar", "checar", or "está certo?".
allowed-tools: Read, Grep
---

# Compact Review

Review code changes efficiently. Output MUST be concise.

## Format

For each issue found, output exactly:

[SEVERITY] file:line — description
FIX: one-line solution

Severities: 🔴 BREAK (will crash) · 🟡 WARN (potential bug) · 🟢 STYLE (non-blocking)

## Focus On

1. Type mismatches between database.ts ↔ domain.ts ↔ mappers.ts
2. Missing React Query cache invalidation after mutations
3. Supabase queries without error handling
4. Fields that break the two-project architecture (distribuidora vs catalogo)

Do NOT comment on: formatting, variable naming, import order.
Maximum output: 15 lines.
```

### 2c. Verificação

Depois de instalar todas as skills, liste o conteúdo de `.claude/skills/` para confirmar que todas foram instaladas:
```bash
ls -la .claude/skills/
```

Deve mostrar pelo menos:
- `find-skills/`
- `frontend-design/`
- `vercel-react-best-practices/`
- `supabase-postgres-best-practices/`
- `ui-ux-pro-max/`
- `fix-and-deploy/`
- `supabase-distribuidora/`
- `review-compact/`

---

## ETAPA 3 — CONFIGURAÇÃO DO PROJETO

### 3a. Atualizar CLAUDE.md

Substitua o conteúdo do `CLAUDE.md` na raiz do projeto por:

```markdown
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

## Known Issue

TS error in `ContatoFormModal.tsx:244` — `'fornecedor'` not in status union. Fix: add to status type in `src/types/domain.ts`.
```

### 3b. Atualizar Antigravity

Substitua `.antigravity/antigravity.json` por:
```json
{
    "version": "1.0",
    "project": "distribuidora",
    "agents": {
        "enabled": false
    },
    "rules": {
        "enabled": true,
        "file": ".antigravity/rules.md"
    },
    "features": {
        "storyDrivenDevelopment": false,
        "agentActivation": false,
        "workflowAutomation": false
    }
}
```

Substitua `.antigravity/rules.md` por:
```markdown
# Development Rules — Distribuidora Mont Massas

## Stack
React 19 · TypeScript · Vite · Tailwind CSS · Supabase · TanStack React Query · Zustand

## Architecture
Supabase → services/*Service.ts → mappers.ts → hooks/use*.ts → pages/*.tsx

Two type systems: database.ts (snake_case, Supabase) ↔ domain.ts (camelCase, app). Mappers bridge them.

## Critical Rules
1. NEVER modify Supabase triggers/RPCs without diagnostic query first
2. Financial calculations validated at every layer: database → service → mapper → component
3. Two-project architecture: distribuidora + catalogo-mont share one Supabase
4. Field ownership: subtitulo, categoria = internal system only. visivel_catalogo = catalog visibility
5. PostgREST: .limit() ignored on DELETE. Silent null on joins = unrecognized FK
6. Always run `npm run build` before considering a task complete
7. Minimal changes only — do NOT refactor unrelated code

## Commands
npm run dev (port 5173) · npm run build · npm run lint · npm run test

## Environment
VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY
Path alias: @/ → ./src/
```

### 3c. Commit final

```bash
git add -A
git commit -m "chore: remove synkrai-aios, add claude code skills, update configs

- Removed .aios-core/ (~12MB, 1039 files)
- Removed debug/output files (20+ files)
- Removed .mcp.json (exposed token)
- Added 8 skills: find-skills, frontend-design, react-best-practices,
  supabase-postgres, ui-ux-pro-max, fix-and-deploy, supabase-distribuidora,
  review-compact
- Updated CLAUDE.md (optimized for token efficiency)
- Updated .antigravity/ config (removed aios-core references)"
```

---

## PÓS-SETUP (ações manuais do Gilmar)

⚠️ **OBRIGATÓRIO**: Rotacionar o SUPABASE_ACCESS_TOKEN em https://supabase.com/dashboard
O token antigo (`sbp_dd02204d...`) está exposto no histórico do Git.

Recriar `.mcp.json` LOCAL (não commitar!) com o novo token:
```json
{
  "mcpServers": {
    "supabase-distribuidora": {
      "command": "node",
      "args": ["C:\\Users\\lukka\\AppData\\Roaming\\npm\\node_modules\\@supabase\\mcp-server-supabase\\dist\\transports\\stdio.js"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU_NOVO_TOKEN_AQUI"
      }
    }
  }
}
```
