-- 1. Create the Audit Function
CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's an INSERT operation
  IF TG_OP = 'INSERT' THEN
    -- Only set created_by if it wasn't explicitly provided (or if you want to force it, overwrite it)
    -- Using auth.uid() directly for Supabase
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    
    -- Ensure times are set
    IF NEW.criado_em IS NULL THEN
        NEW.criado_em = now();
    END IF;
    NEW.atualizado_em = now();
    
  -- If it's an UPDATE operation
  ELSIF TG_OP = 'UPDATE' THEN
    -- Never allow changing created_by or criado_em during an update
    NEW.created_by = OLD.created_by;
    NEW.criado_em = OLD.criado_em;
    
    -- Always update who did it and when
    NEW.updated_by = auth.uid();
    NEW.atualizado_em = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Add columns to VENDAS if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendas' AND column_name='created_by') THEN
    ALTER TABLE public.vendas ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendas' AND column_name='updated_by') THEN
    ALTER TABLE public.vendas ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_vendas_audit ON public.vendas;
CREATE TRIGGER tr_vendas_audit
  BEFORE INSERT OR UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();


-- 3. Add columns to LANCAMENTOS if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos' AND column_name='created_by') THEN
    ALTER TABLE public.lancamentos ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos' AND column_name='updated_by') THEN
    ALTER TABLE public.lancamentos ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_lancamentos_audit ON public.lancamentos;
CREATE TRIGGER tr_lancamentos_audit
  BEFORE INSERT OR UPDATE ON public.lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();


-- 4. Add columns to CONTATOS if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contatos' AND column_name='created_by') THEN
    ALTER TABLE public.contatos ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contatos' AND column_name='updated_by') THEN
    ALTER TABLE public.contatos ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_contatos_audit ON public.contatos;
CREATE TRIGGER tr_contatos_audit
  BEFORE INSERT OR UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();


-- 5. Add columns to CONTAS if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas' AND column_name='created_by') THEN
    ALTER TABLE public.contas ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas' AND column_name='updated_by') THEN
    ALTER TABLE public.contas ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS tr_contas_audit ON public.contas;
CREATE TRIGGER tr_contas_audit
  BEFORE INSERT OR UPDATE ON public.contas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();
