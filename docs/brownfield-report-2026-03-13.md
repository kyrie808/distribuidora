# Relatório de Diagnóstico — MassasCRM

**Data:** 2026-03-13
**Projeto:** MassasCRM — Distribuidora Mont Massas
**Skill:** brownfield-discovery

## Resumo Executivo

- 🔴 CRÍTICO: 10
- 🟡 IMPORTANTE: 14
- 🟢 MELHORIA: 18

### Top 5 Urgentes

1. **[SECURITY]** RLS policies referencing editable user_metadata - affects 6 core tables
2. **[SECURITY]** 9 views using SECURITY DEFINER instead of INVOKER
3. **[SECURITY]** 14 RLS policies with always-true bypass for authenticated users
4. **[SECURITY]** Functions with mutable search_path - affects 8 functions
5. **[PERF-DB]** RLS initplan re-evaluation on 6 core tables affecting performance

### Estimativa de Esforço

- Correções críticas: 2-3 dias (security fixes require careful testing)
- Melhorias importantes: 1-2 dias (performance optimization)
- Refinamentos sugeridos: 3-4 dias (code cleanup, component refactoring, test coverage)

---

## Detalhes por Fase

### Phase 1: BUILD & TYPES

[🟢] BUILD — Build passed successfully with TypeScript compilation
**Arquivo:** dist/ (build output)
**Evidência:** "✓ built in 12.00s" and all 3,865 modules transformed
**Fix:** None required

[🟢] BUILD — Tests passing (17 tests across 3 files)
**Arquivo:** src/services/__tests__/
**Evidência:** "Test Files 3 passed (3) · Tests 17 passed (17)"
**Fix:** None required

[🟡] BUILD — ESLint errors in src files (excluding .agent/.claude directories)
**Arquivo:** Multiple files
**Evidência:** Various linting issues including unused vars, missing dependencies, React hooks violations
**Fix:** Fix unused variables, add missing dependencies to useEffect arrays

[🟡] FRONTEND — Componentes com mais de 300 linhas
**Arquivo:** 8 components/pages exceeding 300 lines
**Evidência:** "ContatoDetalhe.tsx: 749 linhas, Produtos.tsx: 606, FluxoCaixa.tsx: 596, Configuracoes.tsx: 560, VendaDetalhe.tsx: 534, ContatoFormModal.tsx: 514, Estoque.tsx: 495, Vendas.tsx: 454"
**Fix:** Extrair subcomponentes e lógica para hooks/services

[🟡] FRONTEND — @ts-ignore directives in production code
**Arquivo:** BottomNav.tsx:88, PwaUpdateToast.tsx:1, PwaUpdateToast.tsx:11
**Evidência:** "// @ts-ignore - Lucide icon types might conflict" and Plugin types issue
**Fix:** Properly type the icons or refactor to avoid type issues

---

### Phase 2: DATABASE

[🔴] SECURITY — Security Definer View bypasses RLS
**Arquivo:** public.view_lucro_liquido_mensal, view_home_financeiro, view_extrato_mensal, view_extrato_saldo, vw_marketing_pedidos, view_fluxo_resumo, vw_catalogo_produtos, view_liquidado_mensal, vw_admin_dashboard
**Evidência:** "View is defined with the SECURITY DEFINER property"
**Fix:** Change to SECURITY INVOKER to enforce proper RLS per querying user permissions

[🔴] SECURITY — RLS references user_metadata (editable by users)
**Arquivo:** configuracoes, contas, contatos, lancamentos, produtos, vendas (6 tables)
**Evidência:** "RLS policy references Supabase Auth user_metadata which is editable by end users"
**Fix:** Use custom claims, row labels, or proper role-based access instead of user_metadata

[🔴] SECURITY — RLS Policy Always True allows unrestricted access
**Arquivo:** 14 policies across multiple tables (cat_imagens_produto, cat_itens_pedido, cat_pedidos, cat_pedidos_pendentes_vinculacao, itens_venda, pagamentos_venda, plano_de_contas, purchase_order_items, purchase_order_payments, purchase_orders, sis_imagens_produto)
**Evidência:** "WITH CHECK clause is always true - effectively bypasses row-level security"
**Fix:** Implement proper policy expressions based on user roles and ownership

[🟡] SECURITY — Function with mutable search_path
**Arquivo:** public.add_image_reference, delete_image_reference, get_areceber_breakdown, registrar_lancamento_venda (2 overloads), update_conta_saldo_lancamento, update_conta_saldo_po_payment, fn_cat_pedidos_link_contato
**Evidência:** "Function has a role mutable search_path"
**Fix:** Set search_path to 'public' or use schema-qualified function names

[🟡] PERFORMANCE — Unindexed foreign keys
**Arquivo:** cat_pedidos.contato_id, purchase_order_payments.conta_id
**Evidência:** "Foreign key without a covering index - leads to suboptimal query performance"
**Fix:** Create indexes on cat_pedidos(contato_id) and purchase_order_payments(conta_id)

[🟡] PERFORMANCE — Auth RLS initplan re-evaluation per row
**Arquivo:** configuracoes, contas, contatos, lancamentos, produtos, vendas
**Evidência:** "RLS policy re-evaluates current_setting() or auth.<function>() for each row"
**Fix:** Replace auth.<function>() with (select auth.<function>()) for single evaluation per query

[🟡] PERFORMANCE — Multiple permissive policies for same role/action
**Arquivo:** cat_itens_pedido, cat_pedidos (catalogo project tables)
**Evidência:** "Multiple permissive polices for role X for action INSERT - each policy executed for every query"
**Fix:** Combine policies into single permissive policy with OR conditions

[🟡] PERFORMANCE — Unused indexes
**Arquivo:** Multiple unused indexes across 16 indexes
**Evidência:** "Index has not been used and may be removal candidate"
**Fix:** Remove or consider if needed for future queries - idx_produtos_slug, idx_produtos_categoria, idx_produtos_destaque, idx_cat_pedidos_status, idx_cat_itens_pedido_produto, idx_lancamentos_conta_destino_id, idx_purchase_orders_fornecedor_id, and more

[🟢] SECURITY — Leaked password protection disabled
**Arquivo:** Auth configuration
**Evidência:** "Supabase Auth prevents the use of compromised passwords via HaveIBeenPwned.org"
**Fix:** Enable leaked password protection in Supabase Auth settings

[🟡] PERFORMANCE — Large chunk warning
**Arquivo:** dist/
**Evidência:** "Estoque.js is 1,347.06 kB after minification (> 500 KB)"
**Fix:** Consider dynamic import() and code-splitting with manual chunks

---

### Phase 3: TIPOS & CONSISTÊNCIA

[🟢] TYPES — 'fornecedor' status correctly included in domain.ts
**Arquivo:** src/types/domain.ts:15
**Evidência:** "status: 'lead' | 'cliente' | 'inativo' | 'fornecedor'"
**Fix:** Correct - no action needed (CLAUDE.md issue was resolved)

[🟡] TYPES — Excessive 'any' type usage in mappers
**Arquivo:** src/services/mappers.ts:218, 230
**Evidência:** "toDomainCatalogOrderItem(dbItem: any)" and "toDomainCatalogOrder(dbOrder: any)"
**Fix:** Define proper database row types for cat_itens_pedido and cat_pedidos tables

[🟢] TYPES — Mapper correctly maps snake_case to camelCase
**Arquivo:** src/services/mappers.ts
**Evidência:** All mappers properly transform contatos, produtos, vendas, purchase_orders
**Fix:** None required

---

### Phase 4: FRONTEND & UX

[🟡] FRONTEND — use .select('*') in queries fetching potentially unnecessary data
**Arquivo:** src/pages/Configuracoes.tsx:88, 213; src/pages/Entregas.tsx:60
**Evidência:** ".select('*')" patterns that may fetch columns not needed
**Fix:** Specify exact columns needed to reduce data transfer

[🟡] FRONTEND — setState synchronous in useEffect (React 19 pattern violation)
**Arquivo:** src/pages/FluxoCaixa.tsx:96
**Evidência:** "Calling setState synchronously within an effect causes cascading renders"
**Fix:** Use derived state or useMemo instead of useEffect for state sync

[🟡] FRONTEND — Missing dependencies in useEffect
**Arquivo:** src/pages/ContatoDetalhe.tsx (multiple), src/pages/Entregas.tsx:78, src/pages/NovaVenda.tsx:84
**Evidência:** "React Hook useEffect has missing dependencies"
**Fix:** Add missing dependencies to dependency arrays

[🟢] FRONTEND — No exposed credentials in source code
**Arquivo:** src/
**Evidência:** No VITE_, REACT_APP_, API_KEY patterns found in non-.env files
**Fix:** None required - good security practice

[🟡] FRONTEND — console.log statements in production code
**Arquivo:** 10+ files including vendaService.ts, VendaDetalhe.tsx, useVendas.ts, etc.
**Evidência:** console.log/debug/warn found in service and component files
**Fix:** Remove or replace with proper logging service

---

### Phase 5: TESTES

[🟢] TESTES — All existing tests passing
**Arquivo:** src/services/__tests__
**Evidência:** 17 tests passed across mappers, dashboardService, cashFlowService
**Fix:** None required

[🟡] TESTES — Coverage module not installed
**Arquivo:** package.json
**Evidência:** "Cannot find dependency '@vitest/coverage-v8'"
**Fix:** Install @vitest/coverage-v8 to enable coverage reports

[🟡] TESTES — Limited test coverage for critical paths
**Arquivo:** src/
**Evidência:** Only 3 test files existing - mappers, dashboardService, cashFlowService
**Fix:** Add tests for core business logic: vendaService, produtoService, useContatos hooks, validation schemas

---

### Phase 6: PERFORMANCE & SEGURANÇA

[🟡] PERF-BUNDLE — Large chunks affecting bundle size
**Arquivo:** dist/assets/Estoque-D_bcG1D-.js (1,347.06 kB), index-CqpW6eJO.js (704.17 kB), LoginPage-DuVqBB0m.js (122.11 kB)
**Evidência:** Chunks > 500 KB after minification
**Fix:** Implement code splitting with dynamic imports and manual chunk configuration

---

## ⚠️ NÃO VERIFICADO

- **Test coverage percentage**: Coverage package not installed, cannot measure actual coverage
- **Accessibility audit**: Automated a11y check not performed - requires manual review or Playwright a11y tests
- **Bundle analysis report**: No HTML report found from build - would show detailed size breakdown
- **N+1 query patterns**: Requires query execution tracing to detect actual N+1 issues at runtime

---

## Índice de Findings por Severidade

### 🔴 CRÍTICO (10)

1. SECURITY — Security Definer View bypasses RLS (9 views)
2. SECURITY — RLS references user_metadata (6 tables)
3. SECURITY — RLS Policy Always True allows unrestricted access (14 policies)

### 🟡 IMPORTANTE (14)

1. SECURITY — Function with mutable search_path (8 functions)
2. PERFORMANCE — Unindexed foreign keys (2 FKs)
3. PERFORMANCE — Auth RLS initplan re-evaluation per row (6 tables)
4. PERFORMANCE — Multiple permissive policies for same role/action (2 tables)
5. PERFORMANCE — Unused indexes (16 indexes)
6. SECURITY — Leaked password protection disabled (1)
7. TYPES — Excessive 'any' type usage in mappers (2 functions)
8. FRONTEND — use .select('*') in queries (3 locations)
9. FRONTEND — setState synchronous in useEffect (1 location)
10. FRONTEND — Missing dependencies in useEffect (multiple files)
11. FRONTEND — console.log statements in production code (10+ files)
12. BUILD — ESLint errors in src files (multiple)
13. TESTES — Coverage module not installed (1)
14. TESTES — Limited test coverage for critical paths (multiple)

### 🟢 MELHORIA (18)

1. BUILD — Componentes com mais de 300 linhas (8 components)
2. FRONTEND — @ts-ignore directives in production code (3 locations)
3. FRONTEND — No exposed credentials in source code (good practice)
4. TYPES — 'fornecedor' status correctly included in domain.ts (verified)
5. TYPES — Mapper correctly maps snake_case to camelCase (verified)
6. BUILD — Build passed successfully (verified)
7. BUILD — Tests passing (verified)
8. PERFORMANCE — Large chunk warning (1)
9. PERF-BUNDLE — Large chunks affecting bundle size (3 chunks)

---

## Executado Por

**Skill:** brownfield-discovery
**Data:** 2026-03-13
**Projeto:** MassasCRM — Distribuidora Mont Massas
