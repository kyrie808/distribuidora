# Brownfield Remediation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities, performance issues, and code quality problems identified in brownfield discovery

**Architecture:** Sprint-based remediation - Security first (RLS policies, functions, views), then Performance (indexes, queries, bundle splitting), finally Code Quality (refactoring, testing)

**Tech Stack:** Supabase (PostgreSQL, RLS, Views, Functions), React 19, TypeScript, Vite, Vitest

**Project ID:** `herlvujykltxnwqmwmyx` (shared with catalogo-mont)

---

## Sprint 1: Critical Security Fixes

**Target:** Fix RLS vulnerabilities that allow unauthorized access

## Chunk 1: Fix RLS Policies Using user_metadata

**Context:** Current "Admin only access" RLS policies reference `auth.uid()::text = user_metadata->>'isAdmin'`. Since `user_metadata` is editable by users, a user could set `isAdmin: true` and gain admin access.

**Strategy:** Create a dedicated `admin_users` table and use it for auth checks, replacing user_metadata references.

### Task 1: Create admin_users table and migration

**Files:**
- Create: `supabase/migrations/20260313000000_create_admin_users_table.sql`

- [ ] **Step 1: Write migration file**

```sql
-- Create admin_users table for role-based auth
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    criado_em TIMESTAMPTZ DEFAULT timezone('utc', now()),
    UNIQUE(user_id)
);

-- Insert existing admin (you'll need to identify the current admin user_id)
-- INSERT INTO public.admin_users (user_id, role) VALUES ('YOUR_ADMIN_USER_ID', 'admin');

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can read all, users can only read their own
CREATE POLICY "Admin full access on admin_users"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid() AND admin_users.role IN ('admin', 'super_admin')
        )
    );
```

- [ ] **Step 2: Create helper RPC function for admin check**

```sql
-- Add to same migration file
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = is_admin.user_id
        AND admin_users.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- [ ] **Step 3: Apply migration**

Run via Supabase MCP: `apply_migration` with name `create_admin_users_table`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313000000_create_admin_users_table.sql
git commit -m "security: create admin_users table for proper role-based auth"
```

### Task 2: Replace user_metadata RLS policies on all 6 tables

**Files:**
- Create: `supabase/migrations/20260313000001_fix_rls_user_metadata.sql`

**Affected Tables:** configuracoes, contas, contatos, lancamentos, produtos, vendas

- [ ] **Step 1: Write migration with new admin policies**

```sql
-- Drop old policies that reference user_metadata
DROP POLICY IF EXISTS "Admin only access" ON public.configuracoes;
DROP POLICY IF EXISTS "Admin only access" ON public.contas;
DROP POLICY IF EXISTS "Admin only access" ON public.contatos;
DROP POLICY IF EXISTS "Admin only access" ON public.lancamentos;
DROP POLICY IF EXISTS "Admin only access" ON public.produtos;
DROP POLICY IF EXISTS "Admin only access" ON public.vendas;

-- Create new admin policies using is_admin() function
-- Also fixes initplan issue by wrapping auth.uid() in subquery

-- configuracoes
CREATE POLICY "Admin full access"
    ON public.configuracoes
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Public read access on settings"
    ON public.configuracoes
    FOR SELECT
    TO authenticated
    USING (true);

-- contas
CREATE POLICY "Admin full access"
    ON public.contas
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- contatos (users can only see contatos they are not owners of, etc.)
CREATE POLICY "Admin full access"
    ON public.contatos
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Authenticated read access"
    ON public.contatos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert access"
    ON public.contatos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated update access"
    ON public.contatos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- NOTA: Por enquanto todos os usuários autenticados podem ler e edit
-- ar contatos. Quando implementarmos multi-tenancy no futuro, r
-- efinamos essa policy para restringir por ownership (created_by/
-- updated_by fields).

-- lancamentos
CREATE POLICY "Admin full access"
    ON public.lancamentos
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Authenticated read access"
    ON public.lancamentos
    FOR SELECT
    TO authenticated
    USING (true);

-- produtos
CREATE POLICY "Admin full access"
    ON public.produtos
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Public read access"
    ON public.produtos
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- vendas
CREATE POLICY "Admin full access"
    ON public.vendas
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Authenticated read access"
    ON public.vendas
    FOR SELECT
    TO authenticated
    USING (true);
```

- [ ] **Step 2: Apply migration**

Run via Supabase MCP: `apply_migration` with name `fix_rls_user_metadata`

- [ ] **Step 3: Verify security advisors**

Run: `get_advisors` type `security`
Expected: No more "RLS references user_metadata" errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313000001_fix_rls_user_metadata.sql
git commit -m "security: replace user_metadata RLS with admin_users table"
```

---

## Chunk 2: Fix SECURITY DEFINER Views (9 views)

**Context:** Views with SECURITY DEFINER bypass RLS by executing with view creator's permissions. Should use SECURITY INVOKER to respect caller's permissions.

**Affected Views:** view_lucro_liquido_mensal, view_home_financeiro, view_extrato_mensal, view_extrato_saldo, vw_marketing_pedidos, view_fluxo_resumo, vw_catalogo_produtos, view_liquidado_mensal, vw_admin_dashboard

### Task 3: Drop and recreate views with SECURITY INVOKER

**Files:**
- Create: `supabase/migrations/20260313000002_fix_view_security_invoker.sql`

- [ ] **Step 1: Write migration (get current view definitions first)**

First, query each view definition:
```sql
SELECT definition FROM pg_views WHERE schemaname = 'public' AND viewname = 'view_lucro_liquido_mensal';
-- Repeat for each of the 9 views
```

You'll need to extract the CREATE view statements from the current DB. The migration should:

1. DROP each view
2. Recreate with SECURITY INVOKER instead of SECURITY DEFINER

Example structure (you'll need to fill in actual view definitions):

```sql
-- Get current view definitions from DB first
-- Then replace SECURITY DEFINER with SECURITY INVOKER

-- view_lucro_liquido_mensal
DROP VIEW IF EXISTS public.view_lucro_liquido_mensal;
CREATE OR REPLACE VIEW public.view_lucro_liquido_mensal
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- view_home_financeiro
DROP VIEW IF EXISTS public.view_home_financeiro;
CREATE OR REPLACE VIEW public.view_home_financeiro
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- view_extrato_mensal
DROP VIEW IF EXISTS public.view_extrato_mensal;
CREATE OR REPLACE VIEW public.view_extrato_mensal
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- view_extrato_saldo
DROP VIEW IF EXISTS public.view_extrato_saldo;
CREATE OR REPLACE VIEW public.view_extrato_saldo
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- vw_marketing_pedidos
DROP VIEW IF EXISTS public.vw_marketing_pedidos;
CREATE OR REPLACE VIEW public.vw_marketing_pedidos
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- view_fluxo_resumo
DROP VIEW IF EXISTS public.view_fluxo_resumo;
CREATE OR REPLACE VIEW public.view_fluxo_resumo
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- vw_catalogo_produtos
DROP VIEW IF EXISTS public.vw_catalogo_produtos;
CREATE OR REPLACE VIEW public.vw_catalogo_produtos
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- view_liquidado_mensal
DROP VIEW IF EXISTS public.view_liquidado_mensal;
CREATE OR REPLACE VIEW public.view_liquidado_mensal
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;

-- vw_admin_dashboard
DROP VIEW IF EXISTS public.vw_admin_dashboard;
CREATE OR REPLACE VIEW public.vw_admin_dashboard
    AS
    -- [PASTE ACTUAL VIEW DEFINITION FROM DB]
    SECURITY INVOKER;
```

- [ ] **Step 2: Query current view definitions**

Run: `execute_sql` with query:
```sql
SELECT
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN (
    'view_lucro_liquido_mensal',
    'view_home_financeiro',
    'view_extrato_mensal',
    'view_extrato_saldo',
    'vw_marketing_pedidos',
    'view_fluxo_resumo',
    'vw_catalogo_produtos',
    'view_liquidado_mensal',
    'vw_admin_dashboard'
)
ORDER BY viewname;
```

- [ ] **Step 3: Edit migration with actual definitions**

Copy the definitions from step 2 into the migration, ensuring SECURITY DEFINER is replaced with SECURITY INVOKER.

- [ ] **Step 4: Apply migration**

Run via Supabase MCP: `apply_migration` with name `fix_view_security_invoker`

- [ ] **Step 5: Verify security advisors**

Run: `get_advisors` type `security`
Expected: No more "Security Definer View" errors

- [ ] **Step 6: Test views still work**

```sql
-- Test each view returns data
SELECT * FROM public.view_lucro_liquido_mensal LIMIT 1;
SELECT * FROM public.view_home_financeiro LIMIT 1;
SELECT * FROM public.view_extrato_mensal LIMIT 1;
SELECT * FROM public.view_extrato_saldo LIMIT 1;
SELECT * FROM public.vw_marketing_pedidos LIMIT 1;
SELECT * FROM public.view_fluxo_resumo LIMIT 1;
SELECT * FROM public.vw_catalogo_produtos LIMIT 1;
SELECT * FROM public.view_liquidado_mensal LIMIT 1;
SELECT * FROM public.vw_admin_dashboard LIMIT 1;
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260313000002_fix_view_security_invoker.sql
git commit -m "security: change views from SECURITY DEFINER to INVOKER"
```

---

## Chunk 3: Fix RLS Always-True Policies (14 policies)

**Context:** 14 policies have `USING (true)` or `WITH CHECK (true)` which effectively disables RLS for specific operations.

**Policies to Fix:**
- cat_imagens_produto: Authenticated full access (ALL)
- cat_itens_pedido: cat_itens_pedido_insercao_publica (INSERT)
- cat_pedidos: cat_pedidos_insercao_publica (INSERT)
- cat_pedidos_pendentes_vinculacao: Authenticated full access (ALL)
- itens_venda: Authenticated full access (ALL)
- pagamentos_venda: Authenticated full access (ALL)
- plano_de_contas: Full access for authenticated users (ALL)
- purchase_order_items: Authenticated full access (ALL)
- purchase_order_payments: Authenticated full access (ALL)
- purchase_orders: Authenticated full access (ALL)
- sis_imagens_produto: Enable delete/insert/update for authenticated users (3 policies)

### Task 4: Implement proper RLS policies

**Files:**
- Create: `supabase/migrations/20260313000003_fix_always_true_rls_policies.sql`

- [ ] **Step 1: Write migration to replace always-true policies**

```sql
-- DROP always-true policies
DROP POLICY IF EXISTS "Authenticated full access" ON public.cat_imagens_produto;

-- cat_imagens_produto - proper access
CREATE POLICY "Authenticated can read images"
    ON public.cat_imagens_produto
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage images"
    ON public.cat_imagens_produto
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- DROP always-true policies
DROP POLICY IF EXISTS "cat_itens_pedido_insercao_publica" ON public.cat_itens_pedido;
DROP POLICY IF EXISTS "cat_itens_pedido_admin_total" ON public.cat_itens_pedido;

-- cat_itens_pedido - proper access
CREATE POLICY "Authenticated can read items"
    ON public.cat_itens_pedido
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage items"
    ON public.cat_itens_pedido
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- DROP always-true policies
DROP POLICY IF EXISTS "cat_pedidos_insercao_publica" ON public.cat_pedidos;
DROP POLICY IF EXISTS "cat_pedidos_admin_total" ON public.cat_pedidos;

-- cat_pedidos - proper access
CREATE POLICY "Authenticated can read orders"
    ON public.cat_pedidos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage orders"
    ON public.cat_pedidos
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- DROP always-true policies
DROP POLICY IF EXISTS "Authenticated full access" ON public.cat_pedidos_pendentes_vinculacao;

-- cat_pedidos_pendentes_vinculacao - proper access
CREATE POLICY "Admin can manage pending links"
    ON public.cat_pedidos_pendentes_vinculacao
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- DROP always-true policies
DROP POLICY IF EXISTS "Authenticated full access" ON public.itens_venda;

-- itens_venda - proper access
CREATE POLICY "Authenticated can read sale items"
    ON public.itens_venda
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage sale items"
    ON public.itens_venda
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated full access" ON public.pagamentos_venda;

-- pagamentos_venda - proper access
CREATE POLICY "Authenticated can read payments"
    ON public.pagamentos_venda
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage payments"
    ON public.pagamentos_venda
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Full access for authenticated users" ON public.plano_de_contas;

-- plano_de_contas - proper access
CREATE POLICY "Admin can manage chart of accounts"
    ON public.plano_de_contas
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_order_items;

-- purchase_order_items - proper access
CREATE POLICY "Admin can manage PO items"
    ON public.purchase_order_items
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_order_payments;

-- purchase_order_payments - proper access
CREATE POLICY "Admin can manage PO payments"
    ON public.purchase_order_payments
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_orders;

-- purchase_orders - proper access
CREATE POLICY "Admin can manage POs"
    ON public.purchase_orders
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.sis_imagens_produto;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sis_imagens_produto;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.sis_imagens_produto;

-- sis_imagens_produto - proper access
CREATE POLICY "Authenticated can read product images"
    ON public.sis_imagens_produto
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage product images"
    ON public.sis_imagens_produto
    FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));
```

- [ ] **Step 2: Apply migration**

Run via Supabase MCP: `apply_migration` with name `fix_always_true_rls_policies`

- [ ] **Step 3: Verify security advisors**

Run: `get_advisors` type `security`
Expected: No more "RLS Policy Always True" warnings

- [ ] **Step 4: Test app still works**

Run: `npm run dev` and test critical user flows:
- Login as admin user
- View dashboard
- Create/edit contatos, vendas, produtos
- Run: `npm run build` to verify no build errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260313000003_fix_always_true_rls_policies.sql
git commit -m "security: fix always-true RLS policies with proper auth checks"
```

---

## Sprint 2: Important Security & Performance Fixes

## Chunk 4: Fix Functions with Mutable search_path (8 functions)

**Functions:** add_image_reference, delete_image_reference, get_areceber_breakdown, registrar_lancamento_venda (2 overloads), update_conta_saldo_lancamento, update_conta_saldo_po_payment, fn_cat_pedidos_link_contato

### Task 5: Add search_path to all functions

**Files:**
- Create: `supabase/migrations/20260313000004_fix_function_search_path.sql`

- [ ] **Step 1: Write migration**

```sql
-- add_image_reference
CREATE OR REPLACE FUNCTION public.add_image_reference(p_produto_id UUID, p_url TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.sis_imagens_produto (produto_id, url, tipo, ativo, ordem, created_at, updated_at)
    VALUES (p_produto_id, p_url, 'internal', true, 0, timezone('utc', now()), timezone('utc', now()))
    ON CONFLICT (produto_id) DO UPDATE SET
        url = EXCLUDED.url,
        updated_at = timezone('utc', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- delete_image_reference
CREATE OR REPLACE FUNCTION public.delete_image_reference(p_produto_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.sis_imagens_produto WHERE produto_id = p_produto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- get_areceber_breakdown
CREATE OR REPLACE FUNCTION public.get_areceber_breakdown(p_data_inicio DATE, p_data_fim DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_a_receber NUMERIC,
    total_vencido NUMERIC,
    total_a_vencer NUMERIC,
    qtd_clientes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(v.total - COALESCE(v.valor_pago, 0)), 0)::NUMERIC AS total_a_receber,
        COALESCE(SUM(CASE WHEN v.data_prevista_pagamento < CURRENT_DATE THEN v.total - COALESCE(v.valor_pago, 0) ELSE 0 END), 0)::NUMERIC AS total_vencido,
        COALESCE(SUM(CASE WHEN v.data_prevista_pagamento >= CURRENT_DATE THEN v.total - COALESCE(v.valor_pago, 0) ELSE 0 END), 0)::NUMERIC AS total_a_vencer,
        COUNT(DISTINCT v.contato_id)::BIGINT AS qtd_clientes
    FROM public.vendas v
    WHERE v.status IN ('pendente', 'entregue')
      AND v.forma_pagamento != 'brinde'
      AND v.forma_pagamento IN ('fiado', 'pre_venda')
      AND (v.total - COALESCE(v.valor_pago, 0)) > 0
      AND v.created_at >= p_data_inicio
      AND v.created_at <= p_data_fim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- registrar_lancamento_venda
CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(p_venda_id UUID, p_valor NUMERIC, p_conta_id UUID, p_data DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    v_lancamento_id UUID;
    v_plano_conta_id UUID;
BEGIN
    -- Get default plano_conta_id for venda receitas
    SELECT id INTO v_plano_conta_id
    FROM public.plano_de_contas
    WHERE tipo = 'receita' AND nome ILIKE '%venda%'
    LIMIT 1;

    IF v_plano_conta_id IS NULL THEN
        RAISE EXCEPTION 'Plano de conta para vendas não encontrado';
    END IF;

    -- Create lancamento
    INSERT INTO public.lancamentos (tipo, valor, data, descricao, conta_id, plano_conta_id, origem, venda_id)
    VALUES ('entrada', p_valor, p_data, 'Recebimento venda #' || LEFT(p_venda_id::TEXT, 8), p_conta_id, v_plano_conta_id, 'venda', p_venda_id)
    RETURNING id INTO v_lancamento_id;

    -- Update account balance
    UPDATE public.contas
    SET saldo_atual = saldo_atual + p_valor
    WHERE id = p_conta_id;

    RETURN v_lancamento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- update_conta_saldo_lancamento
CREATE OR REPLACE FUNCTION public.update_conta_saldo_lancamento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.conta_id IS NOT NULL THEN
        UPDATE public.contas
        SET saldo_atual = saldo_atual + CASE NEW.tipo WHEN 'entrada' THEN NEW.valor WHEN 'saida' THEN -NEW.valor ELSE 0 END
        WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.conta_id IS NOT NULL AND NEW.conta_id != OLD.conta_id THEN
        -- Reverse old account
        UPDATE public.contas
        SET saldo_atual = saldo_atual - CASE OLD.tipo WHEN 'entrada' THEN OLD.valor WHEN 'saida' THEN -OLD.valor ELSE 0 END
        WHERE id = OLD.conta_id;
        -- Apply to new account
        UPDATE public.contas
        SET saldo_atual = saldo_atual + CASE NEW.tipo WHEN 'entrada' THEN NEW.valor WHEN 'saida' THEN -NEW.valor ELSE 0 END
        WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.valor != OLD.valor THEN
        UPDATE public.contas
        SET saldo_atual = saldo_atual + (CASE NEW.tipo WHEN 'entrada' THEN NEW.valor WHEN 'saida' THEN -NEW.valor ELSE 0 END) - (CASE OLD.tipo WHEN 'entrada' THEN OLD.valor WHEN 'saida' THEN -OLD.valor ELSE 0 END)
        WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'DELETE' AND OLD.conta_id IS NOT NULL THEN
        UPDATE public.contas
        SET saldo_atual = saldo_atual - CASE OLD.tipo WHEN 'entrada' THEN OLD.valor WHEN 'saida' THEN -OLD.valor ELSE 0 END
        WHERE id = OLD.conta_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- update_conta_saldo_po_payment
CREATE OR REPLACE FUNCTION public.update_conta_saldo_po_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.conta_id IS NOT NULL THEN
        UPDATE public.contas
        SET saldo_atual = saldo_atual - NEW.amount
        WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.conta_id IS NOT NULL AND NEW.conta_id != OLD.conta_id THEN
        UPDATE public.contas SET saldo_atual = saldo_atual + OLD.amount WHERE id = OLD.conta_id;
        UPDATE public.contas SET saldo_atual = saldo_atual - NEW.amount WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.amount != OLD.amount THEN
        UPDATE public.contas
        SET saldo_atual = saldo_atual + OLD.amount - NEW.amount
        WHERE id = NEW.conta_id;
    ELSIF TG_OP = 'DELETE' AND OLD.conta_id IS NOT NULL THEN
        UPDATE public.contas SET saldo_atual = saldo_atual + OLD.amount WHERE id = OLD.conta_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- fn_cat_pedidos_link_contato
CREATE OR REPLACE FUNCTION public.fn_cat_pedidos_link_contato(p_pedido_id UUID, p_contato_id UUID)
RETURNS UUID AS $$
DECLARE
    v_pendente_id UUID;
BEGIN
    -- Insert into cat_pedidos_pendentes_vinculacao
    INSERT INTO public.cat_pedidos_pendentes_vinculacao (cat_pedido_id, motivo_falha)
    VALUES (p_pedido_id, 'Contato vinculado manualmente: ' || p_contato_id)
    RETURNING id INTO v_pendente_id;

    -- Update cat_pedidos with contato_id
    UPDATE public.cat_pedidos
    SET contato_id = p_contato_id
    WHERE id = p_pedido_id;

    RETURN v_pendente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- [ ] **Step 2: Apply migration**

Run via Supabase MCP: `apply_migration` with name `fix_function_search_path`

- [ ] **Step 3: Verify security advisors**

Run: `get_advisors` type `security`
Expected: No more "Function Search Path Mutable" warnings

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313000004_fix_function_search_path.sql
git commit -m "security: add search_path to functions to prevent SQL injection"
```

---

## Chunk 5: Create Missing Indexes

**Indexes needed:**
- cat_pedidos.contato_id
- purchase_order_payments.conta_id

### Task 6: Add indexes for foreign keys

**Files:**
- Create: `supabase/migrations/20260313000005_add_missing_indexes.sql`

- [ ] **Step 1: Write migration**

```sql
-- Index for cat_pedidos.contato_id
CREATE INDEX IF NOT EXISTS idx_cat_pedidos_contato_id
    ON public.cat_pedidos(contato_id);

-- Index for purchase_order_payments.conta_id
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_conta_id
    ON public.purchase_order_payments(conta_id);
```

- [ ] **Step 2: Apply migration**

Run via Supabase MCP: `apply_migration` with name `add_missing_indexes`

- [ ] **Step 3: Verify performance advisors**

Run: `get_advisors` type `performance`
Expected: No more "Unindexed foreign keys" warnings

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313000005_add_missing_indexes.sql
git commit -m "perf: add indexes for unindexed foreign keys"
```

### Task 7: Remove unused indexes

**Files:**
- Create: `supabase/migrations/20260313000006_remove_unused_indexes.sql`

**Unused Indexes:**
- idx_produtos_slug
- idx_produtos_categoria
- idx_produtos_destaque
- idx_cat_pedidos_status
- idx_cat_itens_pedido_produto
- idx_lancamentos_conta_destino_id
- idx_purchase_orders_fornecedor_id
- idx_purchase_order_items_product_id
- idx_purchase_order_items_purchase_order_id
- idx_lancamentos_conta_id
- idx_itens_venda_produto_id
- idx_contas_created_by
- idx_contas_updated_by
- idx_contatos_created_by
- idx_contatos_updated_by
- idx_lancamentos_created_by
- idx_lancamentos_updated_by
- idx_vendas_created_by
- idx_vendas_updated_by

- [ ] **Step 1: Write migration**

```sql
-- Remove unused indexes (causes maintenance overhead and storage bloat)
DROP INDEX IF EXISTS public.idx_produtos_slug;
DROP INDEX IF EXISTS public.idx_produtos_categoria;
DROP INDEX IF EXISTS public.idx_produtos_destaque;
DROP INDEX IF EXISTS public.idx_cat_pedidos_status;
DROP INDEX IF EXISTS public.idx_cat_itens_pedido_produto;
DROP INDEX IF EXISTS public.idx_lancamentos_conta_destino_id;
DROP INDEX IF EXISTS public.idx_purchase_orders_fornecedor_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_product_id;
DROP INDEX IF EXISTS public.idx_purchase_order_items_purchase_order_id;
DROP INDEX IF EXISTS public.idx_lancamentos_conta_id;
DROP INDEX IF EXISTS public.idx_itens_venda_produto_id;
DROP INDEX IF EXISTS public.idx_contas_created_by;
DROP INDEX IF EXISTS public.idx_contas_updated_by;
DROP INDEX IF EXISTS public.idx_contatos_created_by;
DROP INDEX IF EXISTS public.idx_contatos_updated_by;
DROP INDEX IF EXISTS public.idx_lancamentos_created_by;
DROP INDEX IF EXISTS public.idx_lancamentos_updated_by;
DROP INDEX IF EXISTS public.idx_vendas_created_by;
DROP INDEX IF EXISTS public.idx_vendas_updated_by;
```

- [ ] **Step 2: Apply migration**

Run via Supabase MCP: `apply_migration` with name `remove_unused_indexes`

- [ ] **Step 3: Verify performance advisors**

Run: `get_advisors` type `performance`
Expected: No more "Unused Index" warnings

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260313000006_remove_unused_indexes.sql
git commit -m "perf: remove unused indexes to reduce maintenance overhead"
```

---

## Chunk 6: Fix Multiple Permissive Policies (combine policies)

**Tables:** cat_itens_pedido, cat_pedidos (catalogo project)

**Note:** Since Chunk 3 already addressed these tables with proper admin policies, this should now be resolved. Verify and document.

### Task 8: Verify combined policies

- [ ] **Step 1: Check for remaining multi-policy issues**

Run: `execute_sql` with query:
```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, roles, cmd
HAVING COUNT(*) > 1;
```

- [ ] **Step 2: Document if resolved or create migration**

If query returns no rows, policies are properly combined. If results exist, create new migration to combine.

- [ ] **Step 3: Verify performance advisors**

Run: `get_advisors` type `performance`
Expected: No more "Multiple Permissive Policies" warnings

- [ ] **Step 4: Commit documentation or fix**

If no fix needed:
```bash
git add docs/brownfield-report-2026-03-13.md
git commit -m "docs: confirm permissive policies combined"
```

---

## Sprint 3: Code Quality & Performance

## Chunk 7: Fix 'any' Types in Mappers

**Files:** src/services/mappers.ts:218, 230

### Task 9: Add proper types for catalog order mappers

**Files:**
- Modify: `src/services/mappers.ts`

- [ ] **Step 1: Add database row types for catalog tables**

In `src/types/database.ts`, add (if not present):

```typescript
// Catalog order types (from catalogo project)
export type CatalogOrderRow = Table<'cat_pedidos'>
export type CatalogOrderItemRow = Table<'cat_itens_pedido'>
```

- [ ] **Step 2: Update mapper signatures in mappers.ts**

```typescript
// Replace:
export const toDomainCatalogOrderItem = (dbItem: any): DomainCatalogOrderItem => {

// With:
export const toDomainCatalogOrderItem = (dbItem: CatalogOrderItemRow): DomainCatalogOrderItem => {

// Replace:
export const toDomainCatalogOrder = (dbOrder: any): DomainCatalogOrder => {

// With:
export const toDomainCatalogOrder = (dbOrder: CatalogOrderRow): DomainCatalogOrder => {
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors in mappers.ts

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No "Unexpected any" errors in mappers.ts

- [ ] **Step 5: Commit**

```bash
git add src/services/mappers.ts src/types/database.ts
git commit -m "types: fix 'any' types in catalog order mappers"
```

---

## Chunk 8: Fix .select('*') Queries

**Files:**
- Modify: src/pages/Configuracoes.tsx:88, 213
- Modify: src/pages/Entregas.tsx:60

### Task 10: Replace .select('*') with specific columns

- [ ] **Step 1: Fix Configuracoes.tsx:88**

Replace:
```typescript
.select('*')
```
With:
```typescript
.select('id, chave, valor, atualizado_em')
```

- [ ] **Step 2: Fix Configuracoes.tsx:213**

Replace:
```typescript
supabase.from('configuracoes').select('*').eq('chave', 'locais_partida')
```
With:
```typescript
supabase.from('configuracoes').select('id, chave, valor, atualizado_em').eq('chave', 'locais_partida')
```

- [ ] **Step 3: Fix Entregas.tsx:60**

Replace:
```typescript
.select('*')
```
With:
```typescript
.select('id, contato_id, data, data_entrega, status, total, forma_pagamento, observacoes, contatos(id, nome, telefone, endereco, cep, bairro)')
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/Configuracoes.tsx src/pages/Entregas.tsx
git commit -m "perf: replace .select('*') with specific columns"
```

---

## Chunk 9: Fix setState in useEffect (React 19 pattern)

**Files:**
- Modify: src/pages/FluxoCaixa.tsx:96

### Task 11: Remove setState from useEffect

- [ ] **Step 1: Read FluxoCaixa.tsx lines 85-105**

Read file to understand context around the problematic useEffect

- [ ] **Step 2: Refactor to use derived state**

Replace:
```typescript
useEffect(() => {
    setPaginaAtual(1)
}, [selectedMonth])
```

With:
```typescript
// Reset paginaAtual when selectedMonth changes
const paginaAtual = useMemo(() => {
    // Keep track of selectedMonth changes externally or use state
    // This is a more complex refactoring - may need actual state reset
    return // implement proper logic
}, [selectedMonth])
```

Or if simple page reset is needed:
```typescript
// Use key prop on component using selectedMonth to force remount
// Or accept that setState in effect is acceptable for this use case
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No "set-state-in-effect" error in FluxoCaixa.tsx

- [ ] **Step 5: Commit**

```bash
git add src/pages/FluxoCaixa.tsx
git commit -m "fix: remove setState from useEffect in FluxoCaixa"
```

---

## Chunk 10: Fix Missing useEffect Dependencies

**Files:**
- Modify: src/pages/ContatoDetalhe.tsx (multiple locations)
- Modify: src/pages/Entregas.tsx:78
- Modify: src/pages/NovaVenda.tsx:84

### Task 12: Add missing dependencies to useEffect

- [ ] **Step 1: Fix ContatoDetalhe.tsx**

Read the file to identify all useEffect hooks with missing dependencies, then add them properly.

Example:
```typescript
// Before
useEffect(() => {
    fetchContato()
}, [])

// After
useEffect(() => {
    fetchContato()
}, [id, fetchContato]) // or wrap fetchContato in useCallback
```

- [ ] **Step 2: Fix Entregas.tsx:78**

Add `fetchPendingSales` to dependency array or wrap in useCallback

- [ ] **Step 3: Fix NovaVenda.tsx:84**

Check the missing dependencies and add them

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: No "exhaustive-deps" errors in these files

- [ ] **Step 6: Commit**

```bash
git add src/pages/ContatoDetalhe.tsx src/pages/Entregas.tsx src/pages/NovaVenda.tsx
git commit -m "fix: add missing dependencies to useEffect hooks"
```

---

## Chunk 11: Console.log cleanup

**Files:** vendaService.ts, VendaDetalhe.tsx, useVendas.ts, NovaVenda.tsx, Produtos.tsx, produtoService.ts, PurchaseOrderPaymentModal.tsx, PlanoContaModal.tsx, ContasReceber.tsx, PaymentSidebar.tsx

### Task 13: Remove console.log statements

- [ ] **Step 1: Find all console.log in src/**

Run: `grep -rn "console\.\(log\|debug\|warn\)" src/ --include="*.ts" --include="*.tsx"`

- [ ] **Step 2: Remove console.log from service files**

For each service file (vendaService.ts, produtoService.ts):
- Remove all console.log/debug/warn statements
- Consider adding proper logger service if needed

- [ ] **Step 3: Remove console.log from component files**

For each component file:
- Remove all console.log/debug/warn statements
- Keep console.error for genuine error cases only

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/services/vendaService.ts src/services/produtoService.ts src/components/features/vendas/PaymentSidebar.tsx src/components/features/purchase-orders/PurchaseOrderPaymentModal.tsx src/components/features/financeiro/PlanoContaModal.tsx src/pages/VendaDetalhe.tsx src/hooks/useVendas.ts src/pages/NovaVenda.tsx src/pages/Produtos.tsx src/pages/ContasReceber.tsx
git commit -m "chore: remove console.log statements from production code"
```

---

## Chunk 12: Remove @ts-ignore directives

**Files:**
- Modify: src/components/layout/BottomNav.tsx:88
- Modify: src/components/ui/PwaUpdateToast.tsx:1, 11

### Task 14: Fix types instead of using @ts-ignore

- [ ] **Step 1: Fix BottomNav.tsx:88**

Read context around line 88 and implement proper type for Lucide icon with style prop

- [ ] **Step 2: Fix PwaUpdateToast.tsx**

Remove @ts-ignore and properly type the PWA update logic

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No "@ts-ignore" warnings

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/BottomNav.tsx src/components/ui/PwaUpdateToast.tsx
git commit -m "types: remove @ts-ignore directives and fix type issues"
```

---

## Chunk 13: Fix ESLint errors

**Files:** Multiple files with ESLint violations

### Task 15: Fix remaining ESLint issues

- [ ] **Step 1: Run ESLint to see all errors**

Run: `npm run lint -- --max-warnings=0`

- [ ] **Step 2: Fix each ESLint error category**

- **Unused variables:** Remove or prefix with underscore
- **React hooks dependencies:** Add to dependency arrays or wrap in useCallback
- **Any types:** Replace with proper types

- [ ] **Step 3: Run lint again**

Run: `npm run lint`
Expected: Clean output with no errors in src/ directory

- [ ] **Step 4: Commit**

```bash
git add -p # Stage only relevant ESLint fixes
git commit -m "lint: fix remaining ESLint errors in src/"
```

---

## Chunk 14: Setup test coverage

**Files:** package.json

### Task 16: Install coverage module

- [ ] **Step 1: Install coverage package**

Run: `npm install --save-dev @vitest/coverage-v8`

- [ ] **Step 2: Update package.json scripts**

Add coverage script:
```json
"test:coverage": "vitest run --coverage"
```

Update vitest config:
```json
{
  "test": {
    "coverage": {
      "provider": "v8",
      "reporter": ["text", "json", "html"],
      "include": ["src/**/*.{ts,tsx}"],
      "exclude": ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}", "src/types/**", "**/*.d.ts"]
    }
  }
}
```

- [ ] **Step 3: Run coverage report**

Run: `npm run test:coverage`

- [ ] **Step 4: Review coverage report**

Check coverage percentages and identify areas needing tests

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "test: setup test coverage with @vitest/coverage-v8"
```

---

## Chunk 15: Add tests for critical paths

**Target:** Add tests for coverage gaps in vendaService, produtoService, useContatos hooks, validation schemas

### Task 17: Create tests for vendaService

**Files:**
- Create: src/services/__tests__/vendaService.spec.ts

- [ ] **Step 1: Write test file**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { vendaService } from '../vendaService'

describe('vendaService', () => {
    describe('getVendas', () => {
        it('should fetch all vendas with pagination', async () => {
            const mockData = [
                { id: '1', total: 100, status: 'pendente' },
                { id: '2', total: 200, status: 'entregue' }
            ]
            vi.mock('../supabaseClient', () => ({
                supabase: {
                    from: () => ({
                        select: () => ({
                            order: () => ({
                                range: () => ({
                                    data: mockData,
                                    error: null
                                })
                            })
                        })
                    })
                }
            }))

            const result = await vendaService.getVendas(0, 10)
            expect(result).toEqual(mockData)
        })
    })

    // Add more tests for:
    // - createVenda
    // - updateVenda
    // - deleteVenda
    // - getVendaById
    // - financial calculations
})
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- src/services/__tests__/vendaService.spec.ts`

- [ ] **Step 3: Commit**

```bash
git add src/services/__tests__/vendaService.spec.ts
git commit -m "test: add vendaService tests"
```

### Task 18: Create tests for produtoService

**Files:**
- Create: src/services/__tests__/produtoService.spec.ts

- [ ] **Step 1: Write test file**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { produtoService } from '../produtoService'

describe('produtoService', () => {
    describe('getProdutos', () => {
        it('should fetch all produtos', async () => {
            // Similar structure to vendaService tests
        })
    })
    // Add tests for all produtoService methods
})
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- src/services/__tests__/produtoService.spec.ts`

- [ ] **Step 3: Commit**

```bash
git add src/services/__tests__/produtoService.spec.ts
git commit -m "test: add produtoService tests"
```

### Task 19: Create tests for Zod schemas

**Files:**
- Create: src/schemas/__tests__/contatoSchema.spec.ts
- Create: src/schemas/__tests__/vendaSchema.spec.ts

- [ ] **Step 1: Write contato schema tests**

```typescript
import { describe, it, expect } from 'vitest'
import { contatoSchema, contatoFilterSchema } from '../contato'

describe('contatoSchema', () => {
    it('should validate valid contato data', () => {
        const result = contatoSchema.safeParse({
            nome: 'Test User',
            telefone: '11999999999',
            tipo: 'B2C',
            status: 'lead'
        })
        expect(result.success).toBe(true)
    })

    it('should reject invalid telefone', () => {
        const result = contatoSchema.safeParse({
            nome: 'Test User',
            telefone: 'invalid',
            tipo: 'B2C'
        })
        expect(result.success).toBe(false)
    })
})
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- src/schemas/__tests__/`

- [ ] **Step 3: Commit**

```bash
git add src/schemas/__tests__/
git commit -m "test: add Zod schema validation tests"
```

---

## Sprint 4: Bundle Optimization

## Chunk 16: Implement Code Splitting

**Files:** vite.config.ts, src/App.tsx

### Task 20: Configure manual chunks for bundle splitting

- [ ] **Step 1: Read current vite config**

Read: `vite.config.ts`

- [ ] **Step 2: Update vite.config.ts with manual chunks**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Vendor chunks
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor'
                        }
                        if (id.includes('@supabase')) {
                            return 'supabase-vendor'
                        }
                        if (id.includes('@tanstack')) {
                            return 'query-vendor'
                        }
                        if (id.includes('framer-motion')) {
                            return 'animation-vendor'
                        }
                        if (id.includes('date-fns') || id.includes('lukeed/cn')) {
                            return 'utils-vendor'
                        }
                        return 'vendor'
                    }

                    // Page-level chunks
                    if (id.includes('/pages/Estoque')) {
                        return 'estoque-page'
                    }
                    if (id.includes('/pages/VendaDetalhe')) {
                        return 'venda-detalhe-page'
                    }
                    if (id.includes('/pages/ContatoDetalhe')) {
                        return 'contato-detalhe-page'
                    }
                    if (id.includes('/pages/Produtos')) {
                        return 'produtos-page'
                    }
                    if (id.includes('/pages/Configuracoes')) {
                        return 'configuracoes-page'
                    }
                    if (id.includes('/pages/FluxoCaixa')) {
                        return 'fluxo-caixa-page'
                    }
                }
            }
        },
        chunkSizeWarningLimit: 600
    }
})
```

- [ ] **Step 3: Update App.tsx to use lazy loading with Suspense**

Ensure all pages are lazy loaded:
```typescript
const Estoque = lazy(() => import('./pages/Estoque'))
const VendaDetalhe = lazy(() => import('./pages/VendaDetalhe'))
// ... other pages

// Wrap routes in Suspense
<Suspense fallback={<Spinner />}>
  <Estoque />
</Suspense>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: All chunks under 500 KB (new chunk structure created)

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/App.tsx
git commit -m "perf: implement code splitting and manual chunks"
```

---

## Chunk 17: Large Component Refactoring

**Target:** Components > 300 lines
- ContatoDetalhe.tsx (749 lines)
- Produtos.tsx (606 lines)
- FluxoCaixa.tsx (596 lines)
- Configuracoes.tsx (560 lines)
- VendaDetalhe.tsx (534 lines)
- ContatoFormModal.tsx (514 lines)
- Estoque.tsx (495 lines)
- Vendas.tsx (454 lines)

### Task 21: Refactor ContatoDetalhe.tsx

**Files:**
- Create: src/components/features/contatos/ContatoHeader.tsx
- Create: src/components/features/contatos/ContatoHistory.tsx
- Create: src/components/features/contatos/ContatoActions.tsx
- Modify: src/pages/ContatoDetalhe.tsx

- [ ] **Step 1: Extract ContatoHeader component**

```typescript
// src/components/features/contatos/ContatoHeader.tsx
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

interface ContatoHeaderProps {
    nome: string
    telefone: string
    status: string
}

export function ContatoHeader({ nome, telefone, status }: ContatoHeaderProps) {
    const navigate = useNavigate()
    // Extract header logic from ContatoDetalhe
    return (
        <header className="...">
            <Button onClick={() => navigate(-1)}>
                <ArrowLeft />
            </Button>
            {/* ... header content */}
        </header>
    )
}
```

- [ ] **Step 2: Extract ContatoHistory component for compras/vendas history**

- [ ] **Step 3: Extract ContatoActions component for edit/delete actions**

- [ ] **Step 4: Update ContatoDetalhe.tsx to use extracted components**

Result should be under 300 lines

- [ ] **Step 5: Test functionality**

Run: `npm run dev` and verify ContatoDetalhe page works

- [ ] **Step 6: Commit**

```bash
git add src/components/features/contatos/ src/pages/ContatoDetalhe.tsx
git commit -m "refactor: split ContatoDetalhe into smaller components"
```

### Task 22: Refactor other large components

Repeat pattern for:
- Produtos.tsx → extract ProductList, ProductCard, ProductFilter
- FluxoCaixa.tsx → extract CashFlowSummary, CashFlowList, CashFlowFilters
- Configuracoes.tsx → extract ConfigSections
- VendaDetalhe.tsx → extract VendaSummary, VendaItems, PaymentSection
- ContatoFormModal.tsx → extract FormSections, AddressFields
- Estoque.tsx → extract StockTable, StockAlerts
- Vendas.tsx → extract VendaFilters, VendaList, VendaStats

---

## Sprint 5: Verification & Documentation

## Chunk 18: Final Verification

### Task 23: Run full diagnostic after all fixes

- [ ] **Step 1: Run security advisors verify**

Run: `get_advisors` type `security`
Expected: All security issues resolved

- [ ] **Step 2: Run performance advisors verify**

Run: `get_advisors` type `performance`
Expected: All important performance issues resolved

- [ ] **Step 3: Run build verify**

Run: `npm run build`
Expected: Clean build with no type errors

- [ ] **Step 4: Run lint verify**

Run: `npm run lint`
Expected: No errors, warnings acceptable

- [ ] **Step 5: Run tests verify**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 6: Run coverage verify**

Run: `npm run test:coverage`
Expected: Key paths have test coverage > 70%

### Task 24: Update brownfield report

- [ ] **Step 1: Create remediation summary in docs**

Create: `docs/brownfield-remediation-summary.md`

```markdown
# Brownfield Remediation Summary

## Completed

- [x] Sprint 1: Security fixes
  - [x] Created admin_users table
  - [x] Fixed RLS user_metadata references (6 tables)
  - [x] Changed 9 views to SECURITY INVOKER
  - [x] Fixed 14 always-true RLS policies
  - [x] Fixed 8 function search_paths

- [x] Sprint 2: Performance fixes
  - [x] Added 2 missing indexes
  - [x] Removed 16+ unused indexes
  - [x] Combined permissive policies

- [x] Sprint 3: Code quality
  - [x] Fixed 'any' types in mappers
  - [x] Replaced .select('*') with specific columns
  - [x] Fixed React hooks issues
  - [x] Removed console.log statements
  - [x] Removed @ts-ignore directives
  - [x] Fixed ESLint errors
  - [x] Added test coverage
  - [x] Added critical path tests

- [x] Sprint 4: Bundle optimization
  - [x] Implemented code splitting with manual chunks
  - [x] Refactored 8 large components

## Remaining

- Optional: Further test coverage expansion
- Optional: Accessibility audit
- Optional: Additional performance monitoring
```

- [ ] **Step 7: Final commit**

```bash
git add docs/brownfield-remediation-summary.md
git commit -m "docs: add brownfield remediation summary"
```

---

## Appendix: File Structure Reference

```
supabase/migrations/
├── 20260313000000_create_admin_users_table.sql
├── 20260313000001_fix_rls_user_metadata.sql
├── 20260313000002_fix_view_security_invoker.sql
├── 20260313000003_fix_always_true_rls_policies.sql
├── 20260313000004_fix_function_search_path.sql
├── 20260313000005_add_missing_indexes.sql
└── 20260313000006_remove_unused_indexes.sql

src/
├── components/features/contatos/
│   ├── ContatoHeader.tsx (new)
│   ├── ContatoHistory.tsx (new)
│   ├── ContatoActions.tsx (new)
│   └── ...
├── components/features/produtos/
│   ├── ProductList.tsx (new)
│   ├── ProductCard.tsx (new)
│   └── ProductFilter.tsx (new)
├── services/__tests__/
│   ├── vendaService.spec.ts (new)
│   ├── produtoService.spec.ts (new)
│   └── ...
├── schemas/__tests__/
│   ├── contatoSchema.spec.ts (new)
│   └── vendaSchema.spec.ts (new)
└── App.tsx (modified for code splitting)

docs/
├── brownfield-report-2026-03-13.md (existing)
└── brownfield-remediation-summary.md (new)
```

---

## Notes

1. **Two-project architecture:** This project shares tables with catalogo-mont. Any schema changes must consider impact on the other project.

2. **Admin user setup:** After applying migrations, you'll need to manually insert the admin user into admin_users table with the correct user_id from auth.users.

3. **Testing strategy:** Test in a development branch first. Use a worktree for each sprint to avoid disrupting main development.

4. **Rollback plan:** Each migration is independent and can be rolled back individually with a reverse migration if needed.

5. **Verification:** After each sprint, run the full brownfield discovery again to verify fixes.
