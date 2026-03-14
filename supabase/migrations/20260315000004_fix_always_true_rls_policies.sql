-- ============================================================
-- Migration 4: Corrigir RLS "Always True" em TODAS as tabelas
-- Risco: Crítico | Impacto catalogo-mont: Alto (mitigado)
-- ============================================================

-- =====================
-- CAT_IMAGENS_PRODUTO
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.cat_imagens_produto;

-- Leitura pública (catálogo precisa ver as imagens)
CREATE POLICY "Public read images"
    ON public.cat_imagens_produto
    FOR SELECT TO public
    USING (true);

-- Admin gerencia
CREATE POLICY "Admin manage images"
    ON public.cat_imagens_produto
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- CAT_ITENS_PEDIDO
-- =====================
DROP POLICY IF EXISTS "cat_itens_pedido_insercao_publica" ON public.cat_itens_pedido;
DROP POLICY IF EXISTS "cat_itens_pedido_admin_total" ON public.cat_itens_pedido;

-- Insert público (catálogo insere itens junto com pedidos via anon)
CREATE POLICY "Public insert items"
    ON public.cat_itens_pedido
    FOR INSERT TO public
    WITH CHECK (true);

-- Admin gerencia (leitura, update, delete)
CREATE POLICY "Admin manage items"
    ON public.cat_itens_pedido
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- CAT_PEDIDOS
-- =====================
DROP POLICY IF EXISTS "cat_pedidos_insercao_publica" ON public.cat_pedidos;
DROP POLICY IF EXISTS "cat_pedidos_admin_total" ON public.cat_pedidos;

-- Insert público (catálogo cria pedidos via anon — CRÍTICO para não quebrar checkout)
CREATE POLICY "Public insert orders"
    ON public.cat_pedidos
    FOR INSERT TO public
    WITH CHECK (true);

-- Admin gerencia (leitura, update, delete)
CREATE POLICY "Admin manage orders"
    ON public.cat_pedidos
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- CAT_PEDIDOS_PENDENTES_VINCULACAO
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.cat_pedidos_pendentes_vinculacao;

-- Somente admin gerencia pedidos pendentes de vinculação
CREATE POLICY "Admin manage pending links"
    ON public.cat_pedidos_pendentes_vinculacao
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- ITENS_VENDA
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.itens_venda;

-- Leitura para autenticados
CREATE POLICY "Authenticated read sale items"
    ON public.itens_venda
    FOR SELECT TO authenticated
    USING (true);

-- Admin gerencia
CREATE POLICY "Admin manage sale items"
    ON public.itens_venda
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- PAGAMENTOS_VENDA
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.pagamentos_venda;

-- Leitura para autenticados
CREATE POLICY "Authenticated read payments"
    ON public.pagamentos_venda
    FOR SELECT TO authenticated
    USING (true);

-- Admin gerencia
CREATE POLICY "Admin manage payments"
    ON public.pagamentos_venda
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- PLANO_DE_CONTAS
-- =====================
DROP POLICY IF EXISTS "Full access for authenticated users" ON public.plano_de_contas;

-- Leitura para autenticados (FluxoCaixa e outras telas leem o plano)
CREATE POLICY "Authenticated read chart of accounts"
    ON public.plano_de_contas
    FOR SELECT TO authenticated
    USING (true);

-- Admin gerencia
CREATE POLICY "Admin manage chart of accounts"
    ON public.plano_de_contas
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- PURCHASE_ORDER_ITEMS
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_order_items;

-- Admin gerencia (tabela interna, sem acesso público)
CREATE POLICY "Admin manage PO items"
    ON public.purchase_order_items
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- PURCHASE_ORDER_PAYMENTS
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_order_payments;

-- Admin gerencia (tabela interna, sem acesso público)
CREATE POLICY "Admin manage PO payments"
    ON public.purchase_order_payments
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- PURCHASE_ORDERS
-- =====================
DROP POLICY IF EXISTS "Authenticated full access" ON public.purchase_orders;

-- Admin gerencia (tabela interna, sem acesso público)
CREATE POLICY "Admin manage POs"
    ON public.purchase_orders
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- SIS_IMAGENS_PRODUTO
-- =====================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.sis_imagens_produto;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sis_imagens_produto;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.sis_imagens_produto;
-- Preservar: "Enable public read access for images" (policy de SELECT TO anon já existe)

-- Admin gerencia (insert, update, delete)
CREATE POLICY "Admin manage product images"
    ON public.sis_imagens_produto
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));
