CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(
  p_venda_id uuid,
  p_valor numeric,
  p_conta_id uuid,
  p_data date,
  p_metodo text DEFAULT NULL,
  p_observacao text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
