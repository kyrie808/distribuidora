drop extension if exists "pg_net";

alter table "public"."cat_imagens_produto" drop constraint "chk_tipo_imagem";

alter table "public"."contatos" drop constraint "contatos_origem_check";

alter table "public"."cat_imagens_produto" add constraint "chk_tipo_imagem" CHECK (((tipo)::text = ANY ((ARRAY['cover'::character varying, 'front'::character varying, 'back'::character varying, 'side'::character varying, 'label'::character varying, 'detail'::character varying, 'ambient'::character varying, 'pack'::character varying])::text[]))) not valid;

alter table "public"."cat_imagens_produto" validate constraint "chk_tipo_imagem";

alter table "public"."contatos" add constraint "contatos_origem_check" CHECK ((origem = ANY (ARRAY['direto'::text, 'indicacao'::text, 'Catálogo Online'::text]))) not valid;

alter table "public"."contatos" validate constraint "contatos_origem_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_sync_cat_pedido_to_venda()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_contato_id uuid;
    v_telefone_normalizado text;
    v_venda_id uuid;
BEGIN
    -- Só processar se o status mudar para 'entregue'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue')) THEN
        
        -- Verificar se já existe venda para este pedido (salvaguarda)
        IF EXISTS (SELECT 1 FROM public.vendas WHERE cat_pedido_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        BEGIN
            -- Normalizar telefone (remover tudo que não for dígito)
            v_telefone_normalizado := regexp_replace(NEW.telefone_cliente, '\D', '', 'g');
            
            -- Se o telefone começar com 55 e tiver 12 ou 13 dígitos, remover o 55
            IF LENGTH(v_telefone_normalizado) >= 12 AND LEFT(v_telefone_normalizado, 2) = '55' THEN
                v_telefone_normalizado := SUBSTRING(v_telefone_normalizado FROM 3);
            END IF;

            -- 1. Tentar encontrar contato pelo telefone (buscamos o normalizado no banco também)
            SELECT id INTO v_contato_id 
            FROM public.contatos 
            WHERE regexp_replace(telefone, '\D', '', 'g') = v_telefone_normalizado
            LIMIT 1;

            -- 2. Se não encontrar, criar novo contato
            IF v_contato_id IS NULL THEN
                INSERT INTO public.contatos (
                    nome, 
                    telefone, 
                    status, 
                    tipo, 
                    origem, 
                    endereco, 
                    observacoes
                ) VALUES (
                    NEW.nome_cliente,
                    NEW.telefone_cliente, -- Mantemos o original no cadastro mas indexamos/comparamos pelo normalizado
                    'cliente',
                    'B2C',
                    'Catálogo Online',
                    NEW.endereco_entrega,
                    'Criado automaticamente via pedido do catálogo #' || NEW.numero_pedido
                ) RETURNING id INTO v_contato_id;
            END IF;

            -- 3. Inserir venda no CRM
            INSERT INTO public.vendas (
                contato_id,
                data,
                total,
                forma_pagamento,
                status,
                pago,
                origem,
                cat_pedido_id,
                observacoes,
                taxa_entrega
            ) VALUES (
                v_contato_id,
                COALESCE(NEW.criado_em::date, CURRENT_DATE),
                (NEW.total_centavos::numeric / 100), -- CONVERSÃO CENTAVOS -> REAIS
                COALESCE(NEW.metodo_pagamento, 'pix'),
                'entregue',
                true,
                'catalogo',
                NEW.id,
                'Pedido Catálogo #' || NEW.numero_pedido || COALESCE('\nObs: ' || NEW.observacoes, ''),
                (COALESCE(NEW.frete_centavos, 0)::numeric / 100)
            ) RETURNING id INTO v_venda_id;

        EXCEPTION WHEN OTHERS THEN
            -- Em caso de qualquer erro, registrar na fila de pendentes
            INSERT INTO public.cat_pedidos_pendentes_vinculacao (cat_pedido_id, motivo_falha)
            VALUES (NEW.id, SQLERRM);
        END;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_audit_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_stock_on_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    item RECORD;
BEGIN
    -- Case 1: Cancelling a sale (Restore stock)
    IF (OLD.status <> 'cancelada' AND NEW.status = 'cancelada') THEN
        FOR item IN SELECT produto_id, quantidade FROM public.itens_venda WHERE venda_id = NEW.id LOOP
            UPDATE public.produtos 
            SET estoque_atual = estoque_atual + item.quantidade
            WHERE id = item.produto_id;
        END LOOP;
    
    -- Case 2: Un-cancelling a sale (Deduct stock again)
    ELSIF (OLD.status = 'cancelada' AND NEW.status = 'pendente') THEN
         FOR item IN SELECT produto_id, quantidade FROM public.itens_venda WHERE venda_id = NEW.id LOOP
            UPDATE public.produtos 
            SET estoque_atual = estoque_atual - item.quantidade
            WHERE id = item.produto_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_order_record RECORD;
    v_item RECORD;
    v_current_stock INTEGER;
    v_current_cost NUMERIC;
    v_new_cost NUMERIC;
    v_total_qty INTEGER;
BEGIN
    -- 1. Check Order Status
    SELECT * INTO v_order_record FROM public.purchase_orders WHERE id = p_order_id;
    
    IF v_order_record IS NULL THEN
        RAISE EXCEPTION 'Purchase Order not found';
    END IF;

    IF v_order_record.status = 'received' THEN
        RAISE EXCEPTION 'Order already received';
    END IF;

    -- 2. Loop Items
    FOR v_item IN 
        SELECT * FROM public.purchase_order_items WHERE purchase_order_id = p_order_id
    LOOP
        -- Fetch current product data
        SELECT estoque_atual, custo 
        INTO v_current_stock, v_current_cost 
        FROM public.produtos 
        WHERE id = v_item.product_id;

        -- Handle potential nulls
        v_current_stock := COALESCE(v_current_stock, 0);
        v_current_cost := COALESCE(v_current_cost, 0);

        -- Calculate Weighted Average Cost
        v_total_qty := v_current_stock + v_item.quantity;

        IF v_total_qty > 0 THEN
            v_new_cost := ((v_current_stock * v_current_cost) + (v_item.quantity * v_item.unit_cost)) / v_total_qty;
        ELSE
            v_new_cost := v_item.unit_cost;
        END IF;

        -- Update Product
        UPDATE public.produtos
        SET 
            estoque_atual = v_total_qty,
            custo = ROUND(v_new_cost, 2),
            atualizado_em = NOW()
        WHERE id = v_item.product_id;
        
    END LOOP;

    -- 3. Update Order Status
    UPDATE public.purchase_orders
    SET 
        status = 'received',
        data_recebimento = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_marcar_venda_paga(p_venda_id uuid, p_conta_id uuid, p_data date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total NUMERIC;
    v_cliente_nome TEXT;
    v_plano_conta_id UUID;
BEGIN
    -- Obter detalhes da venda
    SELECT v.total, c.nome INTO v_total, v_cliente_nome
    FROM public.vendas v
    JOIN public.contatos c ON v.contato_id = c.id
    WHERE v.id = p_venda_id;

    -- Obter ID do plano de contas para "Vendas"
    SELECT id INTO v_plano_conta_id 
    FROM public.plano_de_contas 
    WHERE nome = 'Vendas à Vista' 
    LIMIT 1;

    -- 1. Atualizar a venda
    UPDATE public.vendas 
    SET pago = true, 
        valor_pago = v_total,
        atualizado_em = now()
    WHERE id = p_venda_id;

    -- 2. Criar o lançamento
    INSERT INTO public.lancamentos (
        tipo, valor, data, descricao, conta_id, plano_conta_id, origem, venda_id
    ) VALUES (
        'entrada', v_total, p_data, 'Venda: ' || v_cliente_nome, p_conta_id, v_plano_conta_id, 'venda', p_venda_id
    );

END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_atualizado_em()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_atualizado_em_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_purchase_order_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_amount NUMERIC;
    v_total_paid NUMERIC;
    v_purchase_order_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_purchase_order_id := OLD.purchase_order_id;
    ELSE
        v_purchase_order_id := NEW.purchase_order_id;
    END IF;

    -- Get total amount from order
    SELECT total_amount INTO v_total_amount FROM public.purchase_orders WHERE id = v_purchase_order_id;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM public.purchase_order_payments WHERE purchase_order_id = v_purchase_order_id;

    -- Update order
    UPDATE public.purchase_orders
    SET 
        amount_paid = v_total_paid,
        payment_status = CASE 
            WHEN v_total_paid >= v_total_amount THEN 'paid'::purchase_order_payment_status
            WHEN v_total_paid > 0 THEN 'partial'::purchase_order_payment_status
            ELSE 'unpaid'::purchase_order_payment_status
        END
    WHERE id = v_purchase_order_id;
    
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_venda_pagamento_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.vendas
        SET 
            valor_pago = COALESCE(valor_pago, 0) + NEW.valor,
            -- Auto-update pago status if Paid >= Total (allow small margin for float errors if needed, but numeric is exact)
            pago = (COALESCE(valor_pago, 0) + NEW.valor) >= total
        WHERE id = NEW.venda_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.vendas
        SET 
            valor_pago = GREATEST(0, COALESCE(valor_pago, 0) - OLD.valor),
            pago = (GREATEST(0, COALESCE(valor_pago, 0) - OLD.valor)) >= total
        WHERE id = OLD.venda_id;
    END IF;
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
    combined.id
   FROM (( SELECT l.data,
            l.descricao,
            l.tipo,
                CASE
                    WHEN (l.tipo = 'saida'::text) THEN (- l.valor)
                    ELSE l.valor
                END AS valor,
            l.plano_conta_id,
            l.origem,
            (l.id)::text AS id
           FROM public.lancamentos l
        UNION ALL
         SELECT (pop.payment_date)::date AS data,
            ('Pagamento Fábrica PO: '::text || (po.id)::text) AS descricao,
            'saida'::text AS tipo,
            (- pop.amount) AS valor,
            ( SELECT plano_de_contas.id
                   FROM public.plano_de_contas
                  WHERE (plano_de_contas.nome = 'Compra Fábrica'::text)
                 LIMIT 1) AS plano_conta_id,
            'compra_fabrica'::text AS origem,
            (pop.id)::text AS id
           FROM (public.purchase_order_payments pop
             JOIN public.purchase_orders po ON ((pop.purchase_order_id = po.id)))) combined
     LEFT JOIN public.plano_de_contas pc ON ((combined.plano_conta_id = pc.id)));



  create policy "Allow all deletes on products bucket"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'products'::text));



  create policy "Allow all inserts on products bucket"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'products'::text));



  create policy "Allow all updates on products bucket"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'products'::text))
with check ((bucket_id = 'products'::text));



  create policy "Allow public read access on products bucket"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'products'::text));



