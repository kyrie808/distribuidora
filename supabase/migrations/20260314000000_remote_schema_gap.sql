drop policy "Full access for authenticated users" on "public"."contas";

drop policy "Full access for authenticated users" on "public"."contatos";

drop policy "Full access for authenticated users" on "public"."lancamentos";

drop policy "Full access for authenticated users" on "public"."produtos";

drop policy "Enable all access" on "public"."purchase_order_items";

drop policy "Enable all access for all users" on "public"."purchase_order_payments";

drop policy "Enable all access" on "public"."purchase_orders";

drop policy "Allow delete for all users on sis_imagens_produto" on "public"."sis_imagens_produto";

drop policy "Allow insert for all users on sis_imagens_produto" on "public"."sis_imagens_produto";

drop policy "Allow select for all users on sis_imagens_produto" on "public"."sis_imagens_produto";

drop policy "Allow update for all users on sis_imagens_produto" on "public"."sis_imagens_produto";

drop policy "Full access for authenticated users" on "public"."vendas";

drop policy "cat_itens_pedido_admin_total" on "public"."cat_itens_pedido";

drop policy "cat_pedidos_admin_total" on "public"."cat_pedidos";

alter table "public"."cat_imagens_produto" drop constraint "chk_tipo_imagem";

alter table "public"."contatos" drop constraint "contatos_origem_check";

alter table "public"."contatos" drop constraint "contatos_tipo_check";

alter table "public"."lancamentos" drop constraint "lancamentos_origem_check";

drop view if exists "public"."view_fluxo_resumo";

drop view if exists "public"."view_home_financeiro";

drop view if exists "public"."vw_catalogo_produtos";

drop index if exists "public"."idx_itens_venda_venda";

drop index if exists "public"."idx_vendas_contato";

alter table "public"."cat_imagens_produto" enable row level security;

alter table "public"."cat_pedidos" add column "contato_id" uuid;

alter table "public"."cat_pedidos_pendentes_vinculacao" enable row level security;

alter table "public"."configuracoes" enable row level security;

alter table "public"."contas" add column "atualizado_em" timestamp with time zone default now();

alter table "public"."contas" add column "banco" text;

alter table "public"."contas" add column "saldo_atual" numeric default 0;

alter table "public"."itens_venda" enable row level security;

alter table "public"."lancamentos" add column "atualizado_em" timestamp with time zone default now();

alter table "public"."pagamentos_venda" enable row level security;

alter table "public"."plano_de_contas" add column "automatica" boolean default false;

alter table "public"."produtos" add column "instrucoes_preparo" text;

alter table "public"."produtos" add column "preco_ancoragem" numeric;

alter table "public"."produtos" add column "subtitulo" text;

alter table "public"."produtos" add column "visivel_catalogo" boolean not null default true;

alter table "public"."purchase_order_payments" add column "atualizado_em" timestamp with time zone default now();

alter table "public"."purchase_order_payments" add column "conta_id" uuid;

CREATE INDEX idx_contas_created_by ON public.contas USING btree (created_by);

CREATE INDEX idx_contas_updated_by ON public.contas USING btree (updated_by);

CREATE INDEX idx_contatos_created_by ON public.contatos USING btree (created_by);

CREATE INDEX idx_contatos_updated_by ON public.contatos USING btree (updated_by);

CREATE INDEX idx_lancamentos_created_by ON public.lancamentos USING btree (created_by);

CREATE INDEX idx_lancamentos_updated_by ON public.lancamentos USING btree (updated_by);

CREATE INDEX idx_vendas_created_by ON public.vendas USING btree (created_by);

CREATE INDEX idx_vendas_updated_by ON public.vendas USING btree (updated_by);

CREATE UNIQUE INDEX sis_imagens_produto_produto_id_key ON public.sis_imagens_produto USING btree (produto_id);

alter table "public"."cat_pedidos" add constraint "cat_pedidos_contato_id_fkey" FOREIGN KEY (contato_id) REFERENCES public.contatos(id) not valid;

alter table "public"."cat_pedidos" validate constraint "cat_pedidos_contato_id_fkey";

alter table "public"."purchase_order_payments" add constraint "purchase_order_payments_conta_id_fkey" FOREIGN KEY (conta_id) REFERENCES public.contas(id) not valid;

alter table "public"."purchase_order_payments" validate constraint "purchase_order_payments_conta_id_fkey";

alter table "public"."sis_imagens_produto" add constraint "sis_imagens_produto_produto_id_key" UNIQUE using index "sis_imagens_produto_produto_id_key";

alter table "public"."cat_imagens_produto" add constraint "chk_tipo_imagem" CHECK (((tipo)::text = ANY ((ARRAY['cover'::character varying, 'front'::character varying, 'back'::character varying, 'side'::character varying, 'label'::character varying, 'detail'::character varying, 'ambient'::character varying, 'pack'::character varying])::text[]))) not valid;

alter table "public"."cat_imagens_produto" validate constraint "chk_tipo_imagem";

alter table "public"."contatos" add constraint "contatos_origem_check" CHECK ((origem = ANY (ARRAY['direto'::text, 'indicacao'::text, 'catalogo'::text]))) not valid;

alter table "public"."contatos" validate constraint "contatos_origem_check";

alter table "public"."contatos" add constraint "contatos_tipo_check" CHECK ((tipo = ANY (ARRAY['B2C'::text, 'B2B'::text, 'FORNECEDOR'::text, 'catalogo'::text]))) not valid;

alter table "public"."contatos" validate constraint "contatos_tipo_check";

alter table "public"."lancamentos" add constraint "lancamentos_origem_check" CHECK ((origem = ANY (ARRAY['manual'::text, 'venda'::text, 'compra_fabrica'::text, 'migracao_historica'::text]))) not valid;

alter table "public"."lancamentos" validate constraint "lancamentos_origem_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_image_reference(p_produto_id uuid, p_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
;

CREATE OR REPLACE FUNCTION public.criar_pedido(p_nome_cliente text, p_telefone_cliente text, p_endereco_entrega text, p_metodo_entrega text, p_metodo_pagamento text, p_subtotal_centavos integer, p_frete_centavos integer, p_total_centavos integer, p_observacoes text DEFAULT NULL::text, p_indicado_por text DEFAULT NULL::text, p_itens jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id     UUID;
  v_numero_pedido INTEGER;
  v_pedido        JSONB;
  v_item          JSONB;
BEGIN
  -- 1. Insere o pedido principal
  INSERT INTO cat_pedidos (
    nome_cliente,
    telefone_cliente,
    endereco_entrega,
    metodo_entrega,
    metodo_pagamento,
    subtotal_centavos,
    frete_centavos,
    total_centavos,
    observacoes,
    indicado_por,
    status,
    status_pagamento
  )
  VALUES (
    p_nome_cliente,
    p_telefone_cliente,
    p_endereco_entrega,
    p_metodo_entrega,
    p_metodo_pagamento,
    p_subtotal_centavos,
    p_frete_centavos,
    p_total_centavos,
    p_observacoes,
    p_indicado_por,
    'pendente',
    'pendente'
  )
  RETURNING id, numero_pedido INTO v_pedido_id, v_numero_pedido;

  -- 2. Insere os itens (dentro da mesma transação — falha = rollback automático)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO cat_itens_pedido (
      pedido_id,
      produto_id,
      nome_produto,
      quantidade,
      preco_unitario_centavos,
      total_centavos
    )
    VALUES (
      v_pedido_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price_cents')::INTEGER,
      (v_item->>'total_centavos')::INTEGER
    );
  END LOOP;

  -- 3. Retorna o pedido criado
  v_pedido := jsonb_build_object(
    'id', v_pedido_id,
    'numero_pedido', v_numero_pedido,
    'status', 'pendente',
    'total_centavos', p_total_centavos
  );

  RETURN v_pedido;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- rollback automático do plpgsql
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_image_reference(p_produto_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM sis_imagens_produto WHERE produto_id = p_produto_id;
  DELETE FROM cat_imagens_produto WHERE produto_id = p_produto_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_cat_pedidos_link_contato()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  SELECT id INTO NEW.contato_id
  FROM contatos
  WHERE telefone = NEW.telefone_cliente
  LIMIT 1;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_areceber_breakdown()
 RETURNS TABLE(vencidos bigint, vencem_hoje bigint, vencem_semana bigint, sem_data bigint, valor_vencido numeric, valor_hoje numeric, valor_semana numeric, valor_sem_data numeric)
 LANGUAGE plpgsql
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
$function$
;

CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(p_venda_id uuid, p_valor numeric, p_conta_id uuid, p_data date)
 RETURNS void
 LANGUAGE plpgsql
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_conta_saldo_lancamento()
 RETURNS trigger
 LANGUAGE plpgsql
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_conta_saldo_po_payment()
 RETURNS trigger
 LANGUAGE plpgsql
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
$function$
;

create or replace view "public"."view_liquidado_mensal" as  SELECT (date_trunc('month'::text, COALESCE(pv.data, (v.data)::timestamp with time zone)))::date AS mes,
    count(DISTINCT v.id) AS vendas_liquidadas,
    sum(v.total) AS total_liquidado
   FROM (public.vendas v
     LEFT JOIN public.pagamentos_venda pv ON ((pv.venda_id = v.id)))
  WHERE ((v.pago = true) AND (v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text) AND ((v.origem IS NULL) OR (v.origem <> 'catalogo'::text)))
  GROUP BY (date_trunc('month'::text, COALESCE(pv.data, (v.data)::timestamp with time zone)))
  ORDER BY ((date_trunc('month'::text, COALESCE(pv.data, (v.data)::timestamp with time zone)))::date) DESC;


create or replace view "public"."view_lucro_liquido_mensal" as  WITH meses AS (
         SELECT (date_trunc('month'::text, (vendas.data)::timestamp with time zone))::date AS mes
           FROM public.vendas
          GROUP BY ((date_trunc('month'::text, (vendas.data)::timestamp with time zone))::date)
        )
 SELECT m.mes,
    COALESCE(sum(v.total) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric) AS receita_bruta,
    COALESCE(sum(v.custo_total) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric) AS custo_produtos,
    COALESCE(sum((v.total - v.custo_total)) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric) AS lucro_bruto,
    COALESCE(( SELECT sum(l.valor) AS sum
           FROM public.lancamentos l
          WHERE (((date_trunc('month'::text, (l.data)::timestamp with time zone))::date = m.mes) AND (l.tipo = 'saida'::text) AND (l.origem <> ALL (ARRAY['migracao_historica'::text, 'compra_fabrica'::text])))), (0)::numeric) AS despesas_operacionais,
    COALESCE(( SELECT sum(pop.amount) AS sum
           FROM public.purchase_order_payments pop
          WHERE ((date_trunc('month'::text, pop.payment_date))::date = m.mes)), (0)::numeric) AS custo_fabrica,
    (COALESCE(sum((v.total - v.custo_total)) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric) - COALESCE(( SELECT sum(l.valor) AS sum
           FROM public.lancamentos l
          WHERE (((date_trunc('month'::text, (l.data)::timestamp with time zone))::date = m.mes) AND (l.tipo = 'saida'::text) AND (l.origem <> ALL (ARRAY['migracao_historica'::text, 'compra_fabrica'::text])))), (0)::numeric)) AS lucro_liquido,
        CASE
            WHEN (sum(v.total) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))) > (0)::numeric) THEN round((((COALESCE(sum((v.total - v.custo_total)) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric) - COALESCE(( SELECT sum(l.valor) AS sum
               FROM public.lancamentos l
              WHERE (((date_trunc('month'::text, (l.data)::timestamp with time zone))::date = m.mes) AND (l.tipo = 'saida'::text) AND (l.origem <> ALL (ARRAY['migracao_historica'::text, 'compra_fabrica'::text])))), (0)::numeric)) / NULLIF(sum(v.total) FILTER (WHERE ((v.status = 'entregue'::text) AND (v.forma_pagamento <> 'brinde'::text))), (0)::numeric)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS margem_liquida_pct
   FROM (meses m
     LEFT JOIN public.vendas v ON (((date_trunc('month'::text, (v.data)::timestamp with time zone))::date = m.mes)))
  GROUP BY m.mes
  ORDER BY m.mes DESC;


CREATE OR REPLACE FUNCTION public.registrar_lancamento_venda(p_venda_id uuid, p_valor numeric, p_conta_id uuid, p_data date, p_metodo text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text)
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_purchase_order_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_total_amount NUMERIC;
    v_total_paid   NUMERIC;
    v_purchase_order_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_purchase_order_id := OLD.purchase_order_id;
    ELSE
        v_purchase_order_id := NEW.purchase_order_id;
    END IF;

    SELECT total_amount INTO v_total_amount
    FROM public.purchase_orders
    WHERE id = v_purchase_order_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.purchase_order_payments
    WHERE purchase_order_id = v_purchase_order_id;

    UPDATE public.purchase_orders
    SET
        amount_paid    = v_total_paid,
        payment_status = CASE
            -- CORREÇÃO: ROUND evita erro de floating point (ex: 4229.9999... vs 4230.00)
            WHEN ROUND(v_total_paid::numeric, 2) >= ROUND(v_total_amount::numeric, 2) THEN 'paid'::purchase_order_payment_status
            WHEN v_total_paid > 0                                                      THEN 'partial'::purchase_order_payment_status
            ELSE                                                                            'unpaid'::purchase_order_payment_status
        END
    WHERE id = v_purchase_order_id;

    RETURN NULL;
END;
$function$
;

create or replace view "public"."view_extrato_mensal" as  SELECT combined.data,
    combined.descricao,
    combined.tipo,
    combined.valor,
    COALESCE(pc.categoria, 'Vendas'::text) AS categoria_tipo,
    pc.nome AS categoria_nome,
    combined.origem,
    combined.id,
    combined.conta_id
   FROM (( SELECT l.data,
            l.descricao,
            l.tipo,
                CASE
                    WHEN (l.tipo = 'saida'::text) THEN (- l.valor)
                    ELSE l.valor
                END AS valor,
            l.plano_conta_id,
            l.origem,
            (l.id)::text AS id,
            l.conta_id
           FROM public.lancamentos l
        UNION ALL
         SELECT (pop.payment_date)::date AS data,
            ('Pgto Fábrica: '::text || COALESCE(c.nome, 'PO'::text)) AS descricao,
            'saida'::text AS tipo,
            (- pop.amount) AS valor,
            ( SELECT plano_de_contas.id
                   FROM public.plano_de_contas
                  WHERE (plano_de_contas.nome = 'Compra Fábrica'::text)
                 LIMIT 1) AS plano_conta_id,
            'compra_fabrica'::text AS origem,
            (pop.id)::text AS id,
            pop.conta_id
           FROM ((public.purchase_order_payments pop
             JOIN public.purchase_orders po ON ((pop.purchase_order_id = po.id)))
             LEFT JOIN public.contatos c ON ((po.fornecedor_id = c.id)))) combined
     LEFT JOIN public.plano_de_contas pc ON ((combined.plano_conta_id = pc.id)));


create or replace view "public"."view_fluxo_resumo" as  WITH extrato_metrics AS (
         SELECT (EXTRACT(month FROM view_extrato_mensal.data))::integer AS mes,
            (EXTRACT(year FROM view_extrato_mensal.data))::integer AS ano,
            sum(
                CASE
                    WHEN (view_extrato_mensal.tipo = 'entrada'::text) THEN view_extrato_mensal.valor
                    ELSE (0)::numeric
                END) AS entradas,
            sum(
                CASE
                    WHEN (view_extrato_mensal.tipo = 'saida'::text) THEN abs(view_extrato_mensal.valor)
                    ELSE (0)::numeric
                END) AS saidas
           FROM public.view_extrato_mensal
          GROUP BY ((EXTRACT(month FROM view_extrato_mensal.data))::integer), ((EXTRACT(year FROM view_extrato_mensal.data))::integer)
        ), vendas_metrics AS (
         SELECT (EXTRACT(month FROM vendas.data))::integer AS mes,
            (EXTRACT(year FROM vendas.data))::integer AS ano,
            COALESCE(sum(vendas.total), (0)::numeric) AS faturamento,
            COALESCE(sum(vendas.custo_total), (0)::numeric) AS custo_total,
            COALESCE(sum(
                CASE
                    WHEN (((vendas.pago = false) OR (vendas.pago IS NULL)) AND (vendas.status = 'entregue'::text)) THEN vendas.total
                    ELSE (0)::numeric
                END), (0)::numeric) AS a_receber
           FROM public.vendas
          WHERE (vendas.status <> 'cancelada'::text)
          GROUP BY ((EXTRACT(month FROM vendas.data))::integer), ((EXTRACT(year FROM vendas.data))::integer)
        )
 SELECT em.mes,
    em.ano,
    em.entradas AS total_entradas,
    em.saidas AS total_saidas,
    COALESCE(vm.faturamento, (0)::numeric) AS total_faturamento,
    (COALESCE(vm.faturamento, (0)::numeric) - COALESCE(vm.custo_total, (0)::numeric)) AS lucro_estimado,
    COALESCE(vm.a_receber, (0)::numeric) AS total_a_receber
   FROM (extrato_metrics em
     LEFT JOIN vendas_metrics vm ON (((em.mes = vm.mes) AND (em.ano = vm.ano))));


create or replace view "public"."view_home_financeiro" as  WITH mensais AS (
         SELECT (EXTRACT(year FROM vendas.data))::integer AS ano,
            (EXTRACT(month FROM vendas.data))::integer AS mes,
            COALESCE(sum(vendas.total) FILTER (WHERE (vendas.status = 'entregue'::text)), (0)::numeric) AS faturamento,
            COALESCE(avg(vendas.total) FILTER (WHERE (vendas.status = 'entregue'::text)), (0)::numeric) AS ticket_medio,
            COALESCE(sum((vendas.total - vendas.custo_total)) FILTER (WHERE (vendas.status = 'entregue'::text)), (0)::numeric) AS lucro_estimado,
            COALESCE(sum((vendas.total - vendas.valor_pago)) FILTER (WHERE ((vendas.status = 'entregue'::text) AND (vendas.pago = false) AND (vendas.forma_pagamento <> 'brinde'::text))), (0)::numeric) AS total_a_receber,
            COALESCE(sum(vendas.total) FILTER (WHERE ((vendas.pago = true) AND (vendas.status = 'entregue'::text) AND (vendas.forma_pagamento <> 'brinde'::text) AND ((vendas.origem IS NULL) OR (vendas.origem <> 'catalogo'::text)))), (0)::numeric) AS caixa_mes,
            (COALESCE(count(*) FILTER (WHERE ((vendas.pago = true) AND (vendas.status = 'entregue'::text) AND (vendas.forma_pagamento <> 'brinde'::text) AND ((vendas.origem IS NULL) OR (vendas.origem <> 'catalogo'::text)))), (0)::bigint))::integer AS caixa_mes_count
           FROM public.vendas
          GROUP BY ((EXTRACT(year FROM vendas.data))::integer), ((EXTRACT(month FROM vendas.data))::integer)
        ), alertas AS (
         SELECT json_agg(json_build_object('venda_id', v.id, 'valor', v.total, 'vencimento', v.data_prevista_pagamento, 'contato_nome', c.nome, 'contato_telefone', c.telefone)) AS financeiros
           FROM (public.vendas v
             JOIN public.contatos c ON ((v.contato_id = c.id)))
          WHERE ((v.pago = false) AND (v.status = 'entregue'::text) AND (v.data_prevista_pagamento < CURRENT_DATE) AND (v.forma_pagamento <> 'brinde'::text))
        )
 SELECT ano,
    mes,
    faturamento,
    ticket_medio,
    lucro_estimado,
    total_a_receber,
    caixa_mes AS liquidado_mes,
    caixa_mes_count AS liquidado_mes_count,
    COALESCE(lag(faturamento) OVER (ORDER BY ano, mes), (0)::numeric) AS faturamento_anterior,
        CASE
            WHEN (COALESCE(lag(faturamento) OVER (ORDER BY ano, mes), (0)::numeric) > (0)::numeric) THEN (((faturamento - lag(faturamento) OVER (ORDER BY ano, mes)) / lag(faturamento) OVER (ORDER BY ano, mes)) * (100)::numeric)
            ELSE (0)::numeric
        END AS variacao_faturamento_percentual,
    COALESCE(( SELECT alertas.financeiros
           FROM alertas), '[]'::json) AS alertas_financeiros
   FROM mensais m;


create or replace view "public"."vw_catalogo_produtos" as  SELECT id,
    nome,
    codigo,
    slug,
    descricao,
    categoria AS category,
    subtitulo AS subtitle,
    estoque_atual AS stock_quantity,
    estoque_minimo AS stock_min_alert,
    visivel_catalogo AS is_active,
    destaque AS is_featured,
    ((preco * (100)::numeric))::integer AS price_cents,
    to_char(preco, 'FM999G990D00'::text) AS price_formatted,
    ( SELECT cat_imagens_produto.url
           FROM public.cat_imagens_produto
          WHERE ((cat_imagens_produto.produto_id = p.id) AND ((cat_imagens_produto.tipo)::text = 'cover'::text) AND (cat_imagens_produto.ativo = true))
          ORDER BY cat_imagens_produto.ordem
         LIMIT 1) AS primary_image_url,
    ( SELECT COALESCE(json_agg(json_build_object('id', img.id, 'url', img.url, 'alt_text', img.alt_text, 'is_primary', ((img.tipo)::text = 'cover'::text), 'sort_order', img.ordem) ORDER BY img.ordem), '[]'::json) AS "coalesce"
           FROM public.cat_imagens_produto img
          WHERE ((img.produto_id = p.id) AND (img.ativo = true))) AS images,
        CASE
            WHEN (estoque_atual <= 0) THEN 'Sem Estoque'::text
            WHEN (estoque_atual <= estoque_minimo) THEN 'Estoque Baixo'::text
            ELSE 'Em Estoque'::text
        END AS stock_status,
    round((preco_ancoragem * (100)::numeric)) AS anchor_price_cents,
    instrucoes_preparo
   FROM public.produtos p
  WHERE (visivel_catalogo = true);


create or replace view "public"."vw_marketing_pedidos" as  WITH todas_vendas AS (
         SELECT ((cat_pedidos.criado_em AT TIME ZONE 'America/Sao_Paulo'::text))::date AS data_venda,
            'online'::text AS origem_tipo,
            cat_pedidos.total_centavos AS total_cents,
            cat_pedidos.metodo_entrega,
            cat_pedidos.indicado_por AS referred_by
           FROM public.cat_pedidos
          WHERE ((cat_pedidos.status <> 'cancelado'::text) AND (cat_pedidos.status_pagamento = 'pago'::text))
        UNION ALL
         SELECT vendas.data AS data_venda,
            'direta'::text AS origem_tipo,
            ((vendas.total * (100)::numeric))::integer AS total_cents,
            NULL::text AS metodo_entrega,
            NULL::text AS referred_by
           FROM public.vendas
          WHERE ((vendas.status <> 'cancelada'::text) AND (vendas.pago = true) AND ((vendas.origem IS NULL) OR (vendas.origem <> 'catalogo'::text)))
        )
 SELECT data_venda,
    to_char((data_venda)::timestamp with time zone, 'IYYY-IW'::text) AS semana_iso,
    to_char((data_venda)::timestamp with time zone, 'YYYY-MM'::text) AS mes_iso,
    count(*) AS total_pedidos,
    sum(total_cents) AS faturamento_cents,
    round(avg(total_cents), 0) AS ticket_medio_cents,
    count(*) FILTER (WHERE (origem_tipo = 'online'::text)) AS pedidos_online,
    count(*) FILTER (WHERE (origem_tipo = 'direta'::text)) AS pedidos_diretos,
    sum(total_cents) FILTER (WHERE (origem_tipo = 'online'::text)) AS faturamento_online_cents,
    sum(total_cents) FILTER (WHERE (origem_tipo = 'direta'::text)) AS faturamento_direto_cents,
    count(*) FILTER (WHERE (metodo_entrega = 'entrega'::text)) AS entregas_count,
    count(*) FILTER (WHERE (metodo_entrega = 'retirada'::text)) AS retiradas_count
   FROM todas_vendas
  GROUP BY data_venda
  ORDER BY data_venda DESC;


create or replace view "public"."view_extrato_saldo" as  SELECT to_char(date_trunc('month'::text, (data)::timestamp with time zone), 'MM/YYYY'::text) AS mes,
    (date_trunc('month'::text, (data)::timestamp with time zone))::date AS mes_ordem,
    COALESCE(sum(valor) FILTER (WHERE (tipo = 'entrada'::text)), (0)::numeric) AS entradas,
    abs(COALESCE(sum(valor) FILTER (WHERE (tipo = 'saida'::text)), (0)::numeric)) AS saidas,
    sum(valor) AS saldo_mes,
    sum(sum(valor)) OVER (ORDER BY (date_trunc('month'::text, (data)::timestamp with time zone))) AS saldo_acumulado
   FROM public.view_extrato_mensal
  GROUP BY (date_trunc('month'::text, (data)::timestamp with time zone));


create or replace view "public"."vw_admin_dashboard" as  WITH kpis_produtos AS (
         SELECT count(*) FILTER (WHERE (produtos.ativo = true)) AS produtos_ativos,
            count(*) FILTER (WHERE (produtos.ativo = false)) AS produtos_inativos,
            count(*) FILTER (WHERE ((produtos.estoque_atual <= produtos.estoque_minimo) AND (produtos.ativo = true))) AS produtos_estoque_baixo
           FROM public.produtos
        ), kpis_pedidos_online AS (
         SELECT count(*) FILTER (WHERE (cat_pedidos.status = 'pendente'::text)) AS pedidos_pendentes,
            ( SELECT json_agg(json_build_object('id', t.id, 'order_number', t.numero_pedido, 'customer_name', t.nome_cliente, 'total_formatted', ((t.total_centavos)::numeric / 100.0), 'status', t.status, 'created_at', t.criado_em) ORDER BY t.criado_em DESC) AS json_agg
                   FROM ( SELECT cat_pedidos_1.id,
                            cat_pedidos_1.numero_pedido,
                            cat_pedidos_1.nome_cliente,
                            cat_pedidos_1.telefone_cliente,
                            cat_pedidos_1.endereco_entrega,
                            cat_pedidos_1.metodo_entrega,
                            cat_pedidos_1.status,
                            cat_pedidos_1.subtotal_centavos,
                            cat_pedidos_1.frete_centavos,
                            cat_pedidos_1.total_centavos,
                            cat_pedidos_1.metodo_pagamento,
                            cat_pedidos_1.status_pagamento,
                            cat_pedidos_1.observacoes,
                            cat_pedidos_1.indicado_por,
                            cat_pedidos_1.criado_em,
                            cat_pedidos_1.atualizado_em
                           FROM public.cat_pedidos cat_pedidos_1
                          WHERE (cat_pedidos_1.status <> 'cancelado'::text)
                          ORDER BY cat_pedidos_1.criado_em DESC
                         LIMIT 5) t) AS ultimos_pedidos
           FROM public.cat_pedidos
        ), kpis_financeiro AS (
         SELECT COALESCE(sum(
                CASE
                    WHEN (vw_marketing_pedidos.data_venda = ((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date) THEN vw_marketing_pedidos.faturamento_online_cents
                    ELSE (0)::bigint
                END), (0)::numeric) AS faturamento_hoje_cents,
            COALESCE(sum(
                CASE
                    WHEN (date_trunc('month'::text, (vw_marketing_pedidos.data_venda)::timestamp without time zone) = date_trunc('month'::text, (((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date)::timestamp without time zone)) THEN vw_marketing_pedidos.faturamento_online_cents
                    ELSE (0)::bigint
                END), (0)::numeric) AS faturamento_mes_cents
           FROM public.vw_marketing_pedidos
        )
 SELECT p.produtos_ativos,
    p.produtos_inativos,
    p.produtos_estoque_baixo,
    o.pedidos_pendentes,
    o.ultimos_pedidos,
    f.faturamento_hoje_cents,
    f.faturamento_mes_cents
   FROM ((kpis_produtos p
     CROSS JOIN kpis_pedidos_online o)
     CROSS JOIN kpis_financeiro f);



  create policy "Authenticated full access"
  on "public"."cat_imagens_produto"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Authenticated full access"
  on "public"."cat_pedidos_pendentes_vinculacao"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Admin only access"
  on "public"."configuracoes"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Admin only access"
  on "public"."contas"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Admin only access"
  on "public"."contatos"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Authenticated full access"
  on "public"."itens_venda"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Admin only access"
  on "public"."lancamentos"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Authenticated full access"
  on "public"."pagamentos_venda"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Admin only access"
  on "public"."produtos"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "Authenticated full access"
  on "public"."purchase_order_items"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Authenticated full access"
  on "public"."purchase_order_payments"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Authenticated full access"
  on "public"."purchase_orders"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Enable public read access for images"
  on "public"."sis_imagens_produto"
  as permissive
  for select
  to anon
using (true);



  create policy "Admin only access"
  on "public"."vendas"
  as permissive
  for all
  to authenticated
using ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text))
with check ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));



  create policy "cat_itens_pedido_admin_total"
  on "public"."cat_itens_pedido"
  as permissive
  for all
  to public
using ((( SELECT auth.role() AS role) = 'authenticated'::text))
with check ((( SELECT auth.role() AS role) = 'authenticated'::text));



  create policy "cat_pedidos_admin_total"
  on "public"."cat_pedidos"
  as permissive
  for all
  to public
using ((( SELECT auth.role() AS role) = 'authenticated'::text))
with check ((( SELECT auth.role() AS role) = 'authenticated'::text));


CREATE TRIGGER tr_cat_pedidos_link_contato BEFORE INSERT ON public.cat_pedidos FOR EACH ROW EXECUTE FUNCTION public.fn_cat_pedidos_link_contato();

CREATE TRIGGER tr_lancamentos_saldo AFTER INSERT OR DELETE OR UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_conta_saldo_lancamento();

CREATE TRIGGER tr_po_payments_saldo AFTER INSERT OR DELETE OR UPDATE ON public.purchase_order_payments FOR EACH ROW EXECUTE FUNCTION public.update_conta_saldo_po_payment();



