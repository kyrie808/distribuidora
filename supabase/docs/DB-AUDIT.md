# Database Audit — Mont Distribuidora

**Data:** 2026-02-21  
**Agente:** @data-engineer (Brownfield Discovery — FASE 2)  
**Projeto:** distribuidora-prod (`herlvujykltxnwqmwmyx`)  
**Postgres:** 17.6.1 | **Região:** us-west-2

---

## 1. Resumo Executivo

| Categoria | Total | 🔴 Crítico | 🟡 Alto | 🟢 Médio |
|-----------|-------|-----------|---------|----------|
| **Security Lints** | 41 | 17 | 23 | 1 |
| **Performance Lints** | 32 | 0 | 16 | 16 |
| **Total** | **73** | **17** | **39** | **17** |

> ⚠️ **Veredicto**: O banco possui **vulnerabilidades de segurança críticas** que devem ser endereçadas antes de qualquer feature work.

---

## 2. Vulnerabilidades de Segurança (🔴 ERROS)

### 2.1 RLS Desabilitado (5 tabelas)

As seguintes tabelas estão **expostas publicamente** sem Row Level Security:

| Tabela | Rows | Impacto |
|--------|------|---------|
| `itens_venda` | 484 | Dados de vendas acessíveis sem autenticação |
| `pagamentos_venda` | 73 | Dados financeiros expostos |
| `configuracoes` | 5 | Configurações do sistema acessíveis |
| `cat_imagens_produto` | 5 | Imagens do catálogo manipuláveis |
| `cat_pedidos_pendentes_vinculacao` | 0 | Sem dados, mas endpoint exposto |

**Remediação**: [Docs RLS](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

### 2.2 Security Definer Views (12 views)

**TODAS as 12 views** estão definidas como `SECURITY DEFINER`, executando com permissões do criador (não do usuário):

- `ranking_compras`, `ranking_indicacoes`
- `crm_view_monthly_sales`, `crm_view_operational_snapshot`
- `view_home_operacional`, `view_home_alertas`, `view_home_financeiro`
- `view_extrato_mensal`, `view_fluxo_resumo`
- `vw_catalogo_produtos`, `vw_admin_dashboard`, `vw_marketing_pedidos`

**Remediação**: Recriar views como `SECURITY INVOKER` → [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

### 2.3 RLS Policies `USING (true)` — Bypass Efetivo (⚠️ WARN)

Tabelas com RLS ativado mas policies que fazem bypass completo:

| Tabela | Policy | Escopo |
|--------|--------|--------|
| `contatos` | Full access for authenticated users | ALL para authenticated |
| `vendas` | Full access for authenticated users | ALL para authenticated |
| `produtos` | Full access for authenticated users | ALL para authenticated |
| `contas` | Full access for authenticated users | ALL para authenticated |
| `lancamentos` | Full access for authenticated users | ALL para authenticated |
| `plano_de_contas` | Full access for authenticated users | ALL para authenticated |
| `purchase_orders` | Enable all access | ALL para **todos** (anon incluso!) |
| `purchase_order_items` | Enable all access | ALL para **todos** |
| `purchase_order_payments` | Enable all access for all users | ALL para **todos** |
| `sis_imagens_produto` | Múltiplas policies duplicadas | ALL para **todos** |
| `cat_pedidos` | insercao_publica | INSERT para **todos** |
| `cat_itens_pedido` | insercao_publica | INSERT para **todos** |

> 🔴 **Crítico**: `purchase_orders`, `purchase_order_items` e `purchase_order_payments` permitem acesso a **usuários não autenticados** (anon role).

### 2.4 Functions sem `search_path` fixo (9 funções)

| Função | Risco |
|--------|-------|
| `update_venda_pagamento_summary` | Mutable search_path |
| `update_atualizado_em_column` | Mutable search_path |
| `handle_stock_on_status_change` | Mutable search_path |
| `receive_purchase_order` | Mutable search_path |
| `update_purchase_order_payment_status` | Mutable search_path |
| `fn_sync_cat_pedido_to_venda` | Mutable search_path |
| `rpc_marcar_venda_paga` | Mutable search_path |
| `handle_audit_fields` | Mutable search_path |
| `update_atualizado_em` | Mutable search_path |

**Remediação**: Adicionar `SET search_path = public` em cada function → [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

### 2.5 Leaked Password Protection Desabilitado

Proteção contra senhas vazadas (HaveIBeenPwned) está **desabilitada** no Supabase Auth.

**Remediação**: Ativar em Auth Settings → [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## 3. Problemas de Performance

### 3.1 Foreign Keys sem Índice (8 FKs)

| Tabela | Foreign Key |
|--------|-------------|
| `contas` | `contas_created_by_fkey` |
| `contas` | `contas_updated_by_fkey` |
| `contatos` | `contatos_created_by_fkey` |
| `contatos` | `contatos_updated_by_fkey` |
| `lancamentos` | `lancamentos_created_by_fkey` |
| `lancamentos` | `lancamentos_updated_by_fkey` |
| `vendas` | `vendas_created_by_fkey` |
| `vendas` | `vendas_updated_by_fkey` |

> Todas são FKs de **audit fields** (`created_by`, `updated_by`) referenciando `auth.users`.

### 3.2 Índices Duplicados (2)

| Tabela | Índices Duplicados | Ação |
|--------|-------------------|------|
| `itens_venda` | `idx_itens_venda_venda` = `idx_itens_venda_venda_id` | Dropar um |
| `vendas` | `idx_vendas_contato` = `idx_vendas_contato_id` | Dropar um |

### 3.3 Índices Não Utilizados (16)

| Tabela | Índice |
|--------|--------|
| `produtos` | `idx_produtos_slug`, `idx_produtos_categoria`, `idx_produtos_destaque` |
| `cat_pedidos` | `idx_cat_pedidos_status` |
| `cat_itens_pedido` | `idx_cat_itens_pedido_produto` |
| `cat_pedidos_pendentes_vinculacao` | `idx_cat_pedidos_pendentes_vinculacao_cat_pedido_id` |
| `lancamentos` | `idx_lancamentos_conta_destino_id`, `idx_lancamentos_venda_id`, `idx_lancamentos_conta_id`, `idx_lancamentos_plano_conta_id`, `idx_lancamentos_purchase_order_payment_id` |
| `purchase_orders` | `idx_purchase_orders_fornecedor_id` |
| `purchase_order_items` | `idx_purchase_order_items_product_id`, `idx_purchase_order_items_purchase_order_id` |
| `itens_venda` | `idx_itens_venda_produto_id` |
| `pagamentos_venda` | `idx_pagamentos_venda_venda_id` |

> ℹ️ Muitos destes índices provavelmente serão utilizados conforme o volume crescer. Manter por ora, mas monitorar.

### 3.4 RLS InitPlan (2 policies)

Policies que re-avaliam `auth.<function>()` por row em vez de usar subselect:

| Tabela | Policy |
|--------|--------|
| `cat_pedidos` | `cat_pedidos_admin_total` |
| `cat_itens_pedido` | `cat_itens_pedido_admin_total` |

**Fix**: Trocar `auth.role()` por `(select auth.role())`.

### 3.5 Múltiplas Policies Permissivas (12 sobreposições)

`sis_imagens_produto`: 4 pares duplicados (SELECT, INSERT, UPDATE, DELETE)  
`cat_pedidos`/`cat_itens_pedido`: Overlap entre `_admin_total` e `_insercao_publica`

---

## 4. Extensões Instaladas

| Extensão | Schema | Versão |
|----------|--------|--------|
| `plpgsql` | pg_catalog | 1.0 |
| `pg_graphql` | graphql | 1.5.11 |
| `supabase_vault` | vault | 0.3.1 |
| `uuid-ossp` | extensions | 1.1 |
| `pgcrypto` | extensions | 1.3 |
| `pg_stat_statements` | extensions | 1.11 |

> ℹ️ Extensões minimais. Considerar `pg_trgm` para queries de similaridade e `unaccent` para normalizar buscas (problema `'Catálogo Online'` vs `'catalogo'`).

---

## 5. Integridade de Dados

### 5.1 Inconsistência de Check Constraint

| Tabela | Campo | Constraint | Domain Type | Problema |
|--------|-------|-----------|-------------|----------|
| `contatos` | `origem` | `'direto', 'indicacao', 'Catálogo Online'` | `'direto' \| 'indicacao' \| 'catalogo'` | ⚠️ Acento e case inconsistente |

### 5.2 Naming Inconsistente (PT vs EN)

| Entitys PT 🇧🇷 | Entities EN 🇺🇸 |
|---------------|----------------|
| `contatos`, `vendas`, `itens_venda`, `pagamentos_venda`, `produtos`, `configuracoes`, `contas`, `lancamentos`, `plano_de_contas` | `purchase_orders`, `purchase_order_items`, `purchase_order_payments` |

### 5.3 Audit Fields Incompletos

| Tabela | `created_by` | `updated_by` |
|--------|-------------|-------------|
| `contatos` | ✅ | ✅ |
| `vendas` | ✅ | ✅ |
| `contas` | ✅ | ✅ |
| `lancamentos` | ✅ | ✅ |
| `produtos` | ❌ | ❌ |
| `itens_venda` | ❌ | ❌ |
| `pagamentos_venda` | ❌ | ❌ |
| `purchase_orders` | ❌ | ❌ |
| `cat_pedidos` | ❌ | ❌ |

---

## 6. Priorização de Débitos (DB)

| ID | Débito | Sev. | Esforço | Prioridade |
|----|--------|------|---------|-----------|
| DB-001 | RLS desabilitado em 5 tabelas | 🔴 | 2h | P0 |
| DB-002 | Policies `USING(true)` em purchase_orders (anon!) | 🔴 | 3h | P0 |
| DB-003 | Security Definer em 12 views | 🔴 | 4h | P0 |
| DB-004 | Functions sem `search_path` fixo | 🟡 | 2h | P1 |
| DB-005 | Leaked password protection OFF | 🟡 | 0.5h | P1 |
| DB-006 | Audit FKs sem índice (8) | 🟢 | 1h | P2 |
| DB-007 | Índices duplicados (2) | 🟢 | 0.5h | P2 |
| DB-008 | RLS InitPlan optimization | 🟢 | 0.5h | P2 |
| DB-009 | Policies duplicadas em sis_imagens_produto | 🟢 | 1h | P2 |
| DB-010 | Constraint `origem` inconsistente com domain | 🟡 | 1h | P1 |
| DB-011 | Naming inconsistente PT/EN | 🟢 | 4h | P3 |
| DB-012 | Audit fields em tabelas faltantes | 🟢 | 2h | P3 |

**Esforço total estimado**: ~21h

---

*Gerado por @data-engineer como parte do workflow brownfield-discovery FASE 2*
