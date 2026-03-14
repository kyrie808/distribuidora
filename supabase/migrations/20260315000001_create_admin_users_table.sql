-- ============================================================
-- Migration 1: Criar tabela admin_users + helper function
-- Risco: Baixo | Impacto catalogo-mont: Nenhum
-- ============================================================

-- 1. Tabela admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    criado_em TIMESTAMPTZ DEFAULT timezone('UTC', now()),
    UNIQUE(user_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Política: somente admins existentes podem gerenciar a tabela
CREATE POLICY "Admin full access on admin_users"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users a
            WHERE a.user_id = auth.uid()
              AND a.role IN ('admin', 'super_admin')
        )
    );

-- 4. Helper function (SECURITY DEFINER para bypass de RLS na checagem)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.user_id = is_admin.check_user_id
          AND admin_users.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. SEED: Inserir o admin atual
--
-- Para descobrir o user_id, rode ANTES de aplicar a Migration 2:
--
--   SELECT id, email, raw_user_meta_data->>'role'
--   FROM auth.users
--   ORDER BY created_at
--   LIMIT 5;
--
-- Depois insira com o id correto:
-- ============================================================
-- INSERT INTO public.admin_users (user_id, role)
-- VALUES ('<SEU_USER_ID_AQUI>', 'admin');
-- ============================================================
