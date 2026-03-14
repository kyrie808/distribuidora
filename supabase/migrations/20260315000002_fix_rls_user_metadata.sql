-- ============================================================
-- Migration 2: Substituir user_metadata RLS por is_admin()
-- Risco: Alto | Impacto catalogo-mont: Médio
-- PRÉ-REQUISITO: admin_users já deve ter pelo menos 1 registro!
-- ============================================================

-- =====================
-- CONFIGURACOES
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.configuracoes;

CREATE POLICY "Admin full access"
    ON public.configuracoes
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- Leitura para usuários autenticados (catálogo NÃO usa esta tabela)
CREATE POLICY "Authenticated read access on settings"
    ON public.configuracoes
    FOR SELECT TO authenticated
    USING (true);

-- =====================
-- CONTAS
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.contas;

CREATE POLICY "Admin full access"
    ON public.contas
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- =====================
-- CONTATOS
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.contatos;

CREATE POLICY "Admin full access"
    ON public.contatos
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- Leitura geral para autenticados
CREATE POLICY "Authenticated read access"
    ON public.contatos
    FOR SELECT TO authenticated
    USING (true);

-- Insert público — catálogo-mont registra novos leads via anon
CREATE POLICY "Public insert access"
    ON public.contatos
    FOR INSERT TO public
    WITH CHECK (true);

-- Update para autenticados (admin já cobre via FOR ALL acima)
CREATE POLICY "Authenticated update access"
    ON public.contatos
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================
-- LANCAMENTOS
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.lancamentos;

CREATE POLICY "Admin full access"
    ON public.lancamentos
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Authenticated read access"
    ON public.lancamentos
    FOR SELECT TO authenticated
    USING (true);

-- =====================
-- PRODUTOS
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.produtos;

CREATE POLICY "Admin full access"
    ON public.produtos
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- Leitura pública — catálogo-mont lê produtos via anon
CREATE POLICY "Public read access"
    ON public.produtos
    FOR SELECT TO public
    USING (true);

-- =====================
-- VENDAS
-- =====================
DROP POLICY IF EXISTS "Admin only access" ON public.vendas;

CREATE POLICY "Admin full access"
    ON public.vendas
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Authenticated read access"
    ON public.vendas
    FOR SELECT TO authenticated
    USING (true);
