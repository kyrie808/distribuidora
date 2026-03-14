-- Migration 5: Fix search_path vulnerabilities for 8 functions
-- Retains exact business logic from current database state, appending 'SET search_path = public'

CREATE OR REPLACE FUNCTION public.add_image_reference(p_produto_id uuid, p_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Remove referências antigas
  DELETE FROM sis_imagens_produto WHERE produto_id = p_produto_id;
  DELETE FROM cat_imagens_produto WHERE produto_id = p_produto_id;
  
  -- Insere nas duas tabelas atomicamente
  INSERT INTO sis_imagens_produto (produto_id, url, tipo, ordem, ativo)
  VALUES (p_produto_id, p_url, 'internal', 0, true);
  
  INSERT INTO cat_imagens_produto (produto_id, url, tipo, ordem, ativo)
  VALUES (p_produto_id, p_url, 'cover', 0, true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_image_reference(p_produto_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM sis_imagens_produto WHERE produto_id = p_produto_id;
  DELETE FROM cat_imagens_produto WHERE produto_id = p_produto_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_cat_pedidos_link_contato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  SELECT id INTO NEW.contato_id
  FROM contatos
  WHERE telefone = NEW.telefone_cliente
  LIMIT 1;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_areceber_breakdown()
 RETURNS TABLE(vencidos bigint, vencem_hoje bigint, vencem_semana bigint, sem_data bigint, valor_vencido numeric, valor_hoje numeric, valor_semana numeric, valor_sem_data numeric)
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE data_prevista_pagamento < CURRENT_DATE) as vencidos,
    COUNT(*) FILTER (WHERE data_prevista_pagamento = CURRENT_DATE) as vencem_hoje,
    COUNT(*) FILTER (WHERE data_prevista_pagamento BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7) as vencem_semana,
    COUNT(*) FILTER (WHERE data_prevista_pagamento IS NULL) as sem_data,
    COALESCE(SUM(total) FILTER (WHERE data_prevista_pagamento < CURRENT_DATE), 0) as valor_vencido,
    COALESCE(SUM(total) FILTER (WHERE data_prevista_pagamento = CURRENT_DATE), 0) as valor_hoje,
    COALESCE(SUM(total) FILTER (WHERE data_prevista_pagamento BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 7), 0) as valor_semana,
    COALESCE(SUM(total) FILTER (WHERE data_prevista_pagamento IS NULL), 0) as valor_sem_data
  FROM vendas
  WHERE pago = false
    AND status = 'entregue'
    AND forma_pagamento <> 'brinde'
    AND (origem IS NULL OR origem <> 'catalogo');
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(p_venda_id uuid, p_valor numeric, p_conta_id uuid, p_data date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  v_plano_id uuid;
BEGIN
  SELECT id INTO v_plano_id 
  FROM plano_de_contas 
  WHERE nome = 'Recebimento de Venda' 
  LIMIT 1;

  INSERT INTO lancamentos (data, descricao, valor, tipo, conta_id, plano_conta_id, venda_id, origem)
  VALUES (
    p_data,
    'Recebimento de venda',
    p_valor,
    'entrada',
    p_conta_id,
    v_plano_id,
    p_venda_id,
    'venda'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(p_venda_id uuid, p_valor numeric, p_conta_id uuid, p_data date, p_metodo text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_plano_id uuid;
  v_lancamento_id uuid;
BEGIN
  SELECT id INTO v_plano_id
  FROM plano_de_contas
  WHERE nome = 'Recebimento de Venda'
  LIMIT 1;

  INSERT INTO lancamentos (data, descricao, valor, tipo, conta_id, plano_conta_id, venda_id, origem)
  VALUES (
    p_data,
    CASE
      WHEN p_metodo IS NOT NULL THEN 'Pagamento venda - ' || p_metodo
      ELSE 'Recebimento de venda'
    END,
    p_valor,
    'entrada',
    p_conta_id,
    v_plano_id,
    p_venda_id,
    'venda'
  )
  RETURNING id INTO v_lancamento_id;

  RETURN v_lancamento_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conta_saldo_lancamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + 
            CASE WHEN NEW.tipo = 'entrada' THEN NEW.valor ELSE -NEW.valor END
        WHERE id = NEW.conta_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - 
            CASE WHEN OLD.tipo = 'entrada' THEN OLD.valor ELSE -OLD.valor END
        WHERE id = OLD.conta_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.conta_id = NEW.conta_id) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - 
                CASE WHEN OLD.tipo = 'entrada' THEN OLD.valor ELSE -OLD.valor END +
                CASE WHEN NEW.tipo = 'entrada' THEN NEW.valor ELSE -NEW.valor END
            WHERE id = NEW.conta_id;
        ELSE
            IF (OLD.conta_id IS NOT NULL) THEN
                UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - 
                    CASE WHEN OLD.tipo = 'entrada' THEN OLD.valor ELSE -OLD.valor END
                WHERE id = OLD.conta_id;
            END IF;
            IF (NEW.conta_id IS NOT NULL) THEN
                UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + 
                    CASE WHEN NEW.tipo = 'entrada' THEN NEW.valor ELSE -NEW.valor END
                WHERE id = NEW.conta_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conta_saldo_po_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.amount
            WHERE id = NEW.conta_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.amount
            WHERE id = OLD.conta_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.amount
            WHERE id = OLD.conta_id;
        END IF;
        IF (NEW.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.amount
            WHERE id = NEW.conta_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;
