


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."purchase_order_payment_status" AS ENUM (
    'paid',
    'partial',
    'unpaid'
);


ALTER TYPE "public"."purchase_order_payment_status" OWNER TO "postgres";


CREATE TYPE "public"."purchase_order_status" AS ENUM (
    'pending',
    'received',
    'cancelled'
);


ALTER TYPE "public"."purchase_order_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sync_cat_pedido_to_venda"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_contato_id uuid;
    v_telefone_normalizado text;
    v_venda_id uuid;
BEGIN
    -- S├│ processar se o status mudar para 'entregue'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue')) THEN
        
        -- Verificar se j├í existe venda para este pedido (salvaguarda)
        IF EXISTS (SELECT 1 FROM public.vendas WHERE cat_pedido_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        BEGIN
            -- Normalizar telefone (remover tudo que n├úo for d├¡gito)
            v_telefone_normalizado := regexp_replace(NEW.telefone_cliente, '\D', '', 'g');
            
            -- Se o telefone come├ºar com 55 e tiver 12 ou 13 d├¡gitos, remover o 55
            IF LENGTH(v_telefone_normalizado) >= 12 AND LEFT(v_telefone_normalizado, 2) = '55' THEN
                v_telefone_normalizado := SUBSTRING(v_telefone_normalizado FROM 3);
            END IF;

            -- 1. Tentar encontrar contato pelo telefone (buscamos o normalizado no banco tamb├®m)
            SELECT id INTO v_contato_id 
            FROM public.contatos 
            WHERE regexp_replace(telefone, '\D', '', 'g') = v_telefone_normalizado
            LIMIT 1;

            -- 2. Se n├úo encontrar, criar novo contato
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
                    'Cat├ílogo Online',
                    NEW.endereco_entrega,
                    'Criado automaticamente via pedido do cat├ílogo #' || NEW.numero_pedido
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
                (NEW.total_centavos::numeric / 100), -- CONVERS├âO CENTAVOS -> REAIS
                COALESCE(NEW.metodo_pagamento, 'pix'),
                'entregue',
                true,
                'catalogo',
                NEW.id,
                'Pedido Cat├ílogo #' || NEW.numero_pedido || COALESCE('\nObs: ' || NEW.observacoes, ''),
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
$$;


ALTER FUNCTION "public"."fn_sync_cat_pedido_to_venda"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stock_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_stock_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."receive_purchase_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."receive_purchase_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_marcar_venda_paga"("p_venda_id" "uuid", "p_conta_id" "uuid", "p_data" "date" DEFAULT CURRENT_DATE) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    WHERE nome = 'Vendas ├á Vista' 
    LIMIT 1;

    -- 1. Atualizar a venda
    UPDATE public.vendas 
    SET pago = true, 
        valor_pago = v_total,
        atualizado_em = now()
    WHERE id = p_venda_id;

    -- 2. Criar o lan├ºamento
    INSERT INTO public.lancamentos (
        tipo, valor, data, descricao, conta_id, plano_conta_id, origem, venda_id
    ) VALUES (
        'entrada', v_total, p_data, 'Venda: ' || v_cliente_nome, p_conta_id, v_plano_conta_id, 'venda', p_venda_id
    );

END;
$$;


ALTER FUNCTION "public"."rpc_marcar_venda_paga"("p_venda_id" "uuid", "p_conta_id" "uuid", "p_data" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_atualizado_em_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_atualizado_em_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_order_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_purchase_order_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_venda_pagamento_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_venda_pagamento_summary"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cat_imagens_produto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "produto_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "tipo" character varying(20) DEFAULT 'cover'::character varying NOT NULL,
    "alt_text" "text",
    "ordem" integer DEFAULT 0,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_tipo_imagem" CHECK ((("tipo")::"text" = ANY ((ARRAY['cover'::character varying, 'front'::character varying, 'back'::character varying, 'side'::character varying, 'label'::character varying, 'detail'::character varying, 'ambient'::character varying, 'pack'::character varying])::"text"[])))
);


ALTER TABLE "public"."cat_imagens_produto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cat_itens_pedido" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pedido_id" "uuid",
    "produto_id" "uuid",
    "nome_produto" "text" NOT NULL,
    "quantidade" integer NOT NULL,
    "preco_unitario_centavos" integer NOT NULL,
    "total_centavos" integer NOT NULL
);


ALTER TABLE "public"."cat_itens_pedido" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cat_pedidos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "numero_pedido" integer NOT NULL,
    "nome_cliente" "text" NOT NULL,
    "telefone_cliente" "text" NOT NULL,
    "endereco_entrega" "text",
    "metodo_entrega" "text",
    "status" "text" DEFAULT 'pendente'::"text",
    "subtotal_centavos" integer NOT NULL,
    "frete_centavos" integer DEFAULT 0,
    "total_centavos" integer NOT NULL,
    "metodo_pagamento" "text",
    "status_pagamento" "text" DEFAULT 'pendente'::"text",
    "observacoes" "text",
    "indicado_por" "text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cat_pedidos_metodo_entrega_check" CHECK (("metodo_entrega" = ANY (ARRAY['entrega'::"text", 'retirada'::"text"]))),
    CONSTRAINT "cat_pedidos_metodo_pagamento_check" CHECK (("metodo_pagamento" = ANY (ARRAY['pix'::"text", 'dinheiro'::"text", 'cartao'::"text", 'fiado'::"text"]))),
    CONSTRAINT "cat_pedidos_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'confirmado'::"text", 'preparando'::"text", 'enviado'::"text", 'entregue'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "cat_pedidos_status_pagamento_check" CHECK (("status_pagamento" = ANY (ARRAY['pendente'::"text", 'pago'::"text", 'parcial'::"text"])))
);


ALTER TABLE "public"."cat_pedidos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cat_pedidos_numero_pedido_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cat_pedidos_numero_pedido_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cat_pedidos_numero_pedido_seq" OWNED BY "public"."cat_pedidos"."numero_pedido";



CREATE TABLE IF NOT EXISTS "public"."cat_pedidos_pendentes_vinculacao" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cat_pedido_id" "uuid" NOT NULL,
    "motivo_falha" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cat_pedidos_pendentes_vinculacao" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chave" "text" NOT NULL,
    "valor" "jsonb" NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "saldo_inicial" numeric DEFAULT 0,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "contas_tipo_check" CHECK (("tipo" = ANY (ARRAY['dinheiro'::"text", 'pix'::"text", 'banco'::"text"])))
);


ALTER TABLE "public"."contas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contatos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "telefone" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "subtipo" "text",
    "status" "text" DEFAULT 'lead'::"text" NOT NULL,
    "origem" "text" DEFAULT 'direto'::"text" NOT NULL,
    "indicado_por_id" "uuid",
    "endereco" "text",
    "bairro" "text",
    "observacoes" "text",
    "ultimo_contato" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cep" "text",
    "latitude" double precision,
    "longitude" double precision,
    "apelido" "text",
    "logradouro" "text",
    "numero" "text",
    "complemento" "text",
    "cidade" "text",
    "uf" "text",
    "fts" "tsvector" GENERATED ALWAYS AS ((((("setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("nome", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("apelido", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"simple"'::"regconfig", COALESCE("telefone", ''::"text")), 'A'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("bairro", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("logradouro", ''::"text")), 'C'::"char"))) STORED,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "contatos_origem_check" CHECK (("origem" = ANY (ARRAY['direto'::"text", 'indicacao'::"text", 'Cat├ílogo Online'::"text"]))),
    CONSTRAINT "contatos_status_check" CHECK (("status" = ANY (ARRAY['lead'::"text", 'cliente'::"text", 'inativo'::"text", 'fornecedor'::"text"]))),
    CONSTRAINT "contatos_tipo_check" CHECK (("tipo" = ANY (ARRAY['B2C'::"text", 'B2B'::"text", 'FORNECEDOR'::"text"])))
);


ALTER TABLE "public"."contatos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contato_id" "uuid" NOT NULL,
    "data" "date" DEFAULT CURRENT_DATE NOT NULL,
    "data_entrega" "date",
    "total" numeric(10,2) NOT NULL,
    "forma_pagamento" "text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "observacoes" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pago" boolean DEFAULT false,
    "taxa_entrega" numeric DEFAULT 0,
    "parcelas" smallint DEFAULT 1,
    "data_prevista_pagamento" "date",
    "custo_total" numeric DEFAULT 0,
    "valor_pago" numeric DEFAULT 0,
    "origem" "text" DEFAULT 'direto'::"text",
    "cat_pedido_id" "uuid",
    "fts" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"simple"'::"regconfig", SUBSTRING(("id")::"text" FROM 1 FOR 8)), 'A'::"char") || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("observacoes", ''::"text")), 'B'::"char"))) STORED,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "vendas_forma_pagamento_check" CHECK (("forma_pagamento" = ANY (ARRAY['pix'::"text", 'dinheiro'::"text", 'cartao'::"text", 'fiado'::"text", 'brinde'::"text", 'pre_venda'::"text"]))),
    CONSTRAINT "vendas_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'entregue'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."vendas" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."crm_view_monthly_sales" AS
 SELECT EXTRACT(year FROM "data") AS "ano",
    EXTRACT(month FROM "data") AS "mes",
    COALESCE("sum"("total"), (0)::numeric) AS "faturamento",
    COALESCE("sum"("custo_total"), (0)::numeric) AS "custo_total",
    COALESCE(("sum"("total") - "sum"("custo_total")), (0)::numeric) AS "lucro",
    "count"(*) AS "total_vendas",
    COALESCE("avg"("total"), (0)::numeric) AS "ticket_medio"
   FROM "public"."vendas"
  WHERE ("status" <> 'cancelada'::"text")
  GROUP BY (EXTRACT(year FROM "data")), (EXTRACT(month FROM "data"));


ALTER VIEW "public"."crm_view_monthly_sales" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."crm_view_operational_snapshot" AS
 SELECT ( SELECT COALESCE("sum"(("vendas"."total" - "vendas"."valor_pago")), (0)::numeric) AS "coalesce"
           FROM "public"."vendas"
          WHERE (("vendas"."pago" = false) AND ("vendas"."status" <> 'cancelada'::"text"))) AS "total_a_receber",
    ( SELECT "count"(*) AS "count"
           FROM "public"."vendas"
          WHERE ("vendas"."status" = 'pendente'::"text")) AS "entregas_pendentes_total",
    ( SELECT "count"(*) AS "count"
           FROM "public"."vendas"
          WHERE (("vendas"."status" = 'pendente'::"text") AND ("vendas"."data_entrega" = CURRENT_DATE))) AS "entregas_hoje_pendentes",
    ( SELECT "count"(*) AS "count"
           FROM "public"."vendas"
          WHERE (("vendas"."status" = 'entregue'::"text") AND ("vendas"."data_entrega" = CURRENT_DATE))) AS "entregas_hoje_realizadas",
    ( SELECT "count"(*) AS "count"
           FROM "public"."contatos"
          WHERE ("contatos"."status" = 'cliente'::"text")) AS "clientes_ativos";


ALTER VIEW "public"."crm_view_operational_snapshot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."itens_venda" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venda_id" "uuid" NOT NULL,
    "produto_id" "uuid" NOT NULL,
    "quantidade" numeric(10,3) NOT NULL,
    "preco_unitario" numeric(10,2) NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "custo_unitario" numeric DEFAULT 0
);


ALTER TABLE "public"."itens_venda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lancamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "valor" numeric NOT NULL,
    "data" "date" DEFAULT CURRENT_DATE NOT NULL,
    "descricao" "text",
    "conta_id" "uuid" NOT NULL,
    "conta_destino_id" "uuid",
    "plano_conta_id" "uuid",
    "origem" "text" NOT NULL,
    "venda_id" "uuid",
    "purchase_order_payment_id" "uuid",
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "lancamentos_origem_check" CHECK (("origem" = ANY (ARRAY['manual'::"text", 'venda'::"text", 'compra_fabrica'::"text"]))),
    CONSTRAINT "lancamentos_tipo_check" CHECK (("tipo" = ANY (ARRAY['entrada'::"text", 'saida'::"text", 'transferencia'::"text"])))
);


ALTER TABLE "public"."lancamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagamentos_venda" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venda_id" "uuid" NOT NULL,
    "valor" numeric NOT NULL,
    "data" timestamp with time zone DEFAULT "now"() NOT NULL,
    "observacao" "text",
    "metodo" "text" DEFAULT 'pix'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pagamentos_venda_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."pagamentos_venda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plano_de_contas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "ativo" boolean DEFAULT true,
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "plano_de_contas_categoria_check" CHECK (("categoria" = ANY (ARRAY['fixa'::"text", 'variavel'::"text"]))),
    CONSTRAINT "plano_de_contas_tipo_check" CHECK (("tipo" = ANY (ARRAY['receita'::"text", 'despesa'::"text"])))
);


ALTER TABLE "public"."plano_de_contas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."produtos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "codigo" "text" NOT NULL,
    "preco" numeric(10,2) NOT NULL,
    "custo" numeric(10,2) NOT NULL,
    "unidade" "text" DEFAULT 'kg'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estoque_atual" integer DEFAULT 0,
    "apelido" "text",
    "estoque_minimo" integer DEFAULT 10,
    "slug" "text",
    "descricao" "text",
    "categoria" "text",
    "peso_kg" numeric(10,3),
    "destaque" boolean DEFAULT false
);


ALTER TABLE "public"."produtos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_cost" numeric(10,2) NOT NULL,
    "total_cost" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_cost")) STORED,
    CONSTRAINT "purchase_order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "purchase_order_items_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric))
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "payment_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text" DEFAULT 'pix'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchase_order_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "public"."purchase_order_status" DEFAULT 'pending'::"public"."purchase_order_status" NOT NULL,
    "payment_status" "public"."purchase_order_payment_status" DEFAULT 'unpaid'::"public"."purchase_order_payment_status" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data_recebimento" timestamp with time zone,
    "amount_paid" numeric(10,2) DEFAULT 0,
    "fornecedor_id" "uuid" NOT NULL
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking_compras" AS
 SELECT "c"."id" AS "contato_id",
    "c"."nome",
    COALESCE("sum"("v"."total"), (0)::numeric) AS "total_pontos",
    "count"("v"."id") AS "total_compras",
    "max"("v"."data") AS "ultima_compra"
   FROM ("public"."contatos" "c"
     JOIN "public"."vendas" "v" ON (("v"."contato_id" = "c"."id")))
  WHERE (("v"."status" = 'entregue'::"text") AND ("v"."pago" = true))
  GROUP BY "c"."id", "c"."nome"
 HAVING ("sum"("v"."total") > (0)::numeric);


ALTER VIEW "public"."ranking_compras" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking_indicacoes" AS
 SELECT "i"."id" AS "indicador_id",
    "i"."nome",
    "count"(DISTINCT "c"."id") AS "total_indicados",
    COALESCE("sum"("v"."total"), (0)::numeric) AS "total_vendas_indicados"
   FROM (("public"."contatos" "i"
     JOIN "public"."contatos" "c" ON (("c"."indicado_por_id" = "i"."id")))
     LEFT JOIN "public"."vendas" "v" ON ((("v"."contato_id" = "c"."id") AND ("v"."status" = 'entregue'::"text") AND ("v"."pago" = true))))
  GROUP BY "i"."id", "i"."nome"
 HAVING ("count"("c"."id") > 0);


ALTER VIEW "public"."ranking_indicacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sis_imagens_produto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "produto_id" "uuid",
    "url" "text" NOT NULL,
    "tipo" "text" DEFAULT 'internal'::"text",
    "ordem" integer DEFAULT 0,
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."sis_imagens_produto" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_extrato_mensal" AS
 SELECT "combined"."data",
    "combined"."descricao",
    "combined"."tipo",
    "combined"."valor",
    COALESCE("pc"."categoria", 'Vendas'::"text") AS "categoria_tipo",
    "pc"."nome" AS "categoria_nome",
    "combined"."origem",
    "combined"."id"
   FROM (( SELECT "l"."data",
            "l"."descricao",
            "l"."tipo",
                CASE
                    WHEN ("l"."tipo" = 'saida'::"text") THEN (- "l"."valor")
                    ELSE "l"."valor"
                END AS "valor",
            "l"."plano_conta_id",
            "l"."origem",
            ("l"."id")::"text" AS "id"
           FROM "public"."lancamentos" "l"
        UNION ALL
         SELECT ("pop"."payment_date")::"date" AS "data",
            ('Pagamento F├íbrica PO: '::"text" || ("po"."id")::"text") AS "descricao",
            'saida'::"text" AS "tipo",
            (- "pop"."amount") AS "valor",
            ( SELECT "plano_de_contas"."id"
                   FROM "public"."plano_de_contas"
                  WHERE ("plano_de_contas"."nome" = 'Compra F├íbrica'::"text")
                 LIMIT 1) AS "plano_conta_id",
            'compra_fabrica'::"text" AS "origem",
            ("pop"."id")::"text" AS "id"
           FROM ("public"."purchase_order_payments" "pop"
             JOIN "public"."purchase_orders" "po" ON (("pop"."purchase_order_id" = "po"."id")))) "combined"
     LEFT JOIN "public"."plano_de_contas" "pc" ON (("combined"."plano_conta_id" = "pc"."id")));


ALTER VIEW "public"."view_extrato_mensal" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_fluxo_resumo" AS
 WITH "metrics" AS (
         SELECT EXTRACT(month FROM "view_extrato_mensal"."data") AS "mes",
            EXTRACT(year FROM "view_extrato_mensal"."data") AS "ano",
            "sum"(
                CASE
                    WHEN ("view_extrato_mensal"."tipo" = 'entrada'::"text") THEN "view_extrato_mensal"."valor"
                    ELSE (0)::numeric
                END) AS "entradas",
            "sum"(
                CASE
                    WHEN ("view_extrato_mensal"."tipo" = 'saida'::"text") THEN "abs"("view_extrato_mensal"."valor")
                    ELSE (0)::numeric
                END) AS "saidas"
           FROM "public"."view_extrato_mensal"
          GROUP BY (EXTRACT(month FROM "view_extrato_mensal"."data")), (EXTRACT(year FROM "view_extrato_mensal"."data"))
        )
 SELECT ("mes")::integer AS "mes",
    ("ano")::integer AS "ano",
    "entradas" AS "total_entradas",
    "saidas" AS "total_saidas",
    ("entradas" - "saidas") AS "lucro_estimado",
    ( SELECT COALESCE("sum"("vendas"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."vendas"
          WHERE ((("vendas"."pago" = false) OR ("vendas"."pago" IS NULL)) AND ("vendas"."status" = 'entregue'::"text"))) AS "total_a_receber"
   FROM "metrics" "m";


ALTER VIEW "public"."view_fluxo_resumo" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_home_alertas" AS
 WITH "ultima_compra" AS (
         SELECT "vendas"."contato_id",
            "max"("vendas"."data") AS "ultima_data"
           FROM "public"."vendas"
          WHERE ("vendas"."status" = 'entregue'::"text")
          GROUP BY "vendas"."contato_id"
        )
 SELECT "c"."id" AS "contato_id",
    "c"."nome",
    "c"."telefone",
    "uc"."ultima_data" AS "data_ultima_compra",
    (CURRENT_DATE - "uc"."ultima_data") AS "dias_sem_compra"
   FROM ("public"."contatos" "c"
     JOIN "ultima_compra" "uc" ON (("c"."id" = "uc"."contato_id")))
  WHERE ((CURRENT_DATE - "uc"."ultima_data") > 45)
  ORDER BY (CURRENT_DATE - "uc"."ultima_data") DESC
 LIMIT 10;


ALTER VIEW "public"."view_home_alertas" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_home_financeiro" AS
 WITH "mensais" AS (
         SELECT (EXTRACT(year FROM "vendas"."data"))::integer AS "ano",
            (EXTRACT(month FROM "vendas"."data"))::integer AS "mes",
            COALESCE("sum"("vendas"."total") FILTER (WHERE ("vendas"."status" = 'entregue'::"text")), (0)::numeric) AS "faturamento",
            COALESCE("avg"("vendas"."total") FILTER (WHERE ("vendas"."status" = 'entregue'::"text")), (0)::numeric) AS "ticket_medio",
            COALESCE("sum"(("vendas"."total" - "vendas"."custo_total")) FILTER (WHERE ("vendas"."status" = 'entregue'::"text")), (0)::numeric) AS "lucro_estimado",
            COALESCE("sum"(("vendas"."total" - "vendas"."valor_pago")) FILTER (WHERE (("vendas"."status" = 'entregue'::"text") AND ("vendas"."pago" = false))), (0)::numeric) AS "total_a_receber"
           FROM "public"."vendas"
          GROUP BY ((EXTRACT(year FROM "vendas"."data"))::integer), ((EXTRACT(month FROM "vendas"."data"))::integer)
        ), "alertas" AS (
         SELECT "json_agg"("json_build_object"('venda_id', "v"."id", 'valor', "v"."total", 'vencimento', "v"."data_prevista_pagamento", 'contato_nome', "c"."nome", 'contato_telefone', "c"."telefone")) AS "financeiros"
           FROM ("public"."vendas" "v"
             JOIN "public"."contatos" "c" ON (("v"."contato_id" = "c"."id")))
          WHERE (("v"."pago" = false) AND ("v"."status" = 'entregue'::"text") AND ("v"."data_prevista_pagamento" < CURRENT_DATE))
        )
 SELECT "ano",
    "mes",
    "faturamento",
    "ticket_medio",
    "lucro_estimado",
    "total_a_receber",
    COALESCE("lag"("faturamento") OVER (ORDER BY "ano", "mes"), (0)::numeric) AS "faturamento_anterior",
        CASE
            WHEN (COALESCE("lag"("faturamento") OVER (ORDER BY "ano", "mes"), (0)::numeric) > (0)::numeric) THEN ((("faturamento" - "lag"("faturamento") OVER (ORDER BY "ano", "mes")) / "lag"("faturamento") OVER (ORDER BY "ano", "mes")) * (100)::numeric)
            ELSE (0)::numeric
        END AS "variacao_faturamento_percentual",
    COALESCE(( SELECT "alertas"."financeiros"
           FROM "alertas"), '[]'::json) AS "alertas_financeiros"
   FROM "mensais" "m";


ALTER VIEW "public"."view_home_financeiro" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_home_operacional" AS
 WITH "monthly_metrics" AS (
         SELECT (EXTRACT(year FROM "v"."data"))::integer AS "ano",
            (EXTRACT(month FROM "v"."data"))::integer AS "mes",
            "count"(*) FILTER (WHERE ("v"."status" = 'entregue'::"text")) AS "total_vendas",
            "sum"(COALESCE(( SELECT "sum"("iv"."quantidade") AS "sum"
                   FROM "public"."itens_venda" "iv"
                  WHERE ("iv"."venda_id" = "v"."id")), (0)::numeric)) FILTER (WHERE ("v"."status" = 'entregue'::"text")) AS "total_itens"
           FROM "public"."vendas" "v"
          GROUP BY ((EXTRACT(year FROM "v"."data"))::integer), ((EXTRACT(month FROM "v"."data"))::integer)
        ), "ranking" AS (
         SELECT "json_agg"("r".*) AS "indicacoes"
           FROM ( SELECT "ranking_indicacoes"."indicador_id",
                    "ranking_indicacoes"."nome",
                    "ranking_indicacoes"."total_indicados",
                    "ranking_indicacoes"."total_vendas_indicados"
                   FROM "public"."ranking_indicacoes"
                  ORDER BY "ranking_indicacoes"."total_indicados" DESC, "ranking_indicacoes"."total_vendas_indicados" DESC
                 LIMIT 3) "r"
        ), "ultimas" AS (
         SELECT "json_agg"("uv".*) AS "vendas"
           FROM ( SELECT "v"."id",
                    "v"."data",
                    "v"."total",
                    "v"."status",
                    "v"."pago",
                    "c"."nome" AS "contato_nome"
                   FROM ("public"."vendas" "v"
                     JOIN "public"."contatos" "c" ON (("v"."contato_id" = "c"."id")))
                  ORDER BY "v"."data" DESC, "v"."criado_em" DESC
                 LIMIT 5) "uv"
        )
 SELECT "ano",
    "mes",
    "total_vendas",
    "total_itens",
    ( SELECT "count"(*) AS "count"
           FROM "public"."vendas"
          WHERE ("vendas"."status" = 'pendente'::"text")) AS "pedidos_pendentes",
    ( SELECT "count"(*) AS "count"
           FROM "public"."vendas"
          WHERE (("vendas"."status" = 'entregue'::"text") AND ("vendas"."data" = CURRENT_DATE))) AS "pedidos_entregues_hoje",
    ( SELECT "count"(DISTINCT "vendas"."contato_id") AS "count"
           FROM "public"."vendas"
          WHERE ("vendas"."status" = 'entregue'::"text")) AS "clientes_ativos",
    COALESCE(( SELECT "ranking"."indicacoes"
           FROM "ranking"), '[]'::json) AS "ranking_indicacoes",
    COALESCE(( SELECT "ultimas"."vendas"
           FROM "ultimas"), '[]'::json) AS "ultimas_vendas"
   FROM "monthly_metrics" "m";


ALTER VIEW "public"."view_home_operacional" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_marketing_pedidos" AS
 WITH "todas_vendas" AS (
         SELECT "date"("cat_pedidos"."criado_em") AS "data_venda",
            'online'::"text" AS "origem_tipo",
            "cat_pedidos"."total_centavos" AS "total_cents",
            "cat_pedidos"."metodo_entrega",
            "cat_pedidos"."indicado_por" AS "referred_by"
           FROM "public"."cat_pedidos"
          WHERE ("cat_pedidos"."status" <> 'cancelado'::"text")
        UNION ALL
         SELECT "vendas"."data" AS "data_venda",
            'direta'::"text" AS "origem_tipo",
            (("vendas"."total" * (100)::numeric))::integer AS "total_cents",
            NULL::"text" AS "metodo_entrega",
            NULL::"text" AS "referred_by"
           FROM "public"."vendas"
          WHERE ("vendas"."status" <> 'cancelada'::"text")
        )
 SELECT "data_venda",
    "to_char"(("data_venda")::timestamp with time zone, 'IYYY-IW'::"text") AS "semana_iso",
    "to_char"(("data_venda")::timestamp with time zone, 'YYYY-MM'::"text") AS "mes_iso",
    "count"(*) AS "total_pedidos",
    "sum"("total_cents") AS "faturamento_cents",
    "round"("avg"("total_cents"), 0) AS "ticket_medio_cents",
    "count"(*) FILTER (WHERE ("origem_tipo" = 'online'::"text")) AS "pedidos_online",
    "count"(*) FILTER (WHERE ("origem_tipo" = 'direta'::"text")) AS "pedidos_diretos",
    "sum"("total_cents") FILTER (WHERE ("origem_tipo" = 'online'::"text")) AS "faturamento_online_cents",
    "sum"("total_cents") FILTER (WHERE ("origem_tipo" = 'direta'::"text")) AS "faturamento_direto_cents",
    "count"(*) FILTER (WHERE ("metodo_entrega" = 'entrega'::"text")) AS "entregas_count",
    "count"(*) FILTER (WHERE ("metodo_entrega" = 'retirada'::"text")) AS "retiradas_count"
   FROM "todas_vendas"
  GROUP BY "data_venda"
  ORDER BY "data_venda" DESC;


ALTER VIEW "public"."vw_marketing_pedidos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_admin_dashboard" AS
 WITH "kpis_produtos" AS (
         SELECT "count"(*) FILTER (WHERE ("produtos"."ativo" = true)) AS "produtos_ativos",
            "count"(*) FILTER (WHERE ("produtos"."ativo" = false)) AS "produtos_inativos",
            "count"(*) FILTER (WHERE (("produtos"."estoque_atual" <= "produtos"."estoque_minimo") AND ("produtos"."ativo" = true))) AS "produtos_estoque_baixo"
           FROM "public"."produtos"
        ), "kpis_pedidos_online" AS (
         SELECT "count"(*) FILTER (WHERE ("cat_pedidos"."status" = 'pendente'::"text")) AS "pedidos_pendentes",
            ( SELECT "json_agg"("json_build_object"('id', "t"."id", 'order_number', "t"."numero_pedido", 'customer_name', "t"."nome_cliente", 'total_formatted', (("t"."total_centavos")::numeric / 100.0), 'status', "t"."status", 'created_at', "t"."criado_em") ORDER BY "t"."criado_em" DESC) AS "json_agg"
                   FROM ( SELECT "cat_pedidos_1"."id",
                            "cat_pedidos_1"."numero_pedido",
                            "cat_pedidos_1"."nome_cliente",
                            "cat_pedidos_1"."telefone_cliente",
                            "cat_pedidos_1"."endereco_entrega",
                            "cat_pedidos_1"."metodo_entrega",
                            "cat_pedidos_1"."status",
                            "cat_pedidos_1"."subtotal_centavos",
                            "cat_pedidos_1"."frete_centavos",
                            "cat_pedidos_1"."total_centavos",
                            "cat_pedidos_1"."metodo_pagamento",
                            "cat_pedidos_1"."status_pagamento",
                            "cat_pedidos_1"."observacoes",
                            "cat_pedidos_1"."indicado_por",
                            "cat_pedidos_1"."criado_em",
                            "cat_pedidos_1"."atualizado_em"
                           FROM "public"."cat_pedidos" "cat_pedidos_1"
                          ORDER BY "cat_pedidos_1"."criado_em" DESC
                         LIMIT 5) "t") AS "ultimos_pedidos"
           FROM "public"."cat_pedidos"
        ), "kpis_financeiro" AS (
         SELECT COALESCE("sum"(
                CASE
                    WHEN ("vw_marketing_pedidos"."data_venda" = CURRENT_DATE) THEN "vw_marketing_pedidos"."faturamento_cents"
                    ELSE (0)::bigint
                END), (0)::numeric) AS "faturamento_hoje_cents",
            COALESCE("sum"(
                CASE
                    WHEN ("date_trunc"('month'::"text", ("vw_marketing_pedidos"."data_venda")::timestamp with time zone) = "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone)) THEN "vw_marketing_pedidos"."faturamento_cents"
                    ELSE (0)::bigint
                END), (0)::numeric) AS "faturamento_mes_cents"
           FROM "public"."vw_marketing_pedidos"
        )
 SELECT "p"."produtos_ativos",
    "p"."produtos_inativos",
    "p"."produtos_estoque_baixo",
    "o"."pedidos_pendentes",
    "o"."ultimos_pedidos",
    "f"."faturamento_hoje_cents",
    "f"."faturamento_mes_cents"
   FROM (("kpis_produtos" "p"
     CROSS JOIN "kpis_pedidos_online" "o")
     CROSS JOIN "kpis_financeiro" "f");


ALTER VIEW "public"."vw_admin_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_catalogo_produtos" AS
 SELECT "id",
    "nome",
    "codigo",
    "slug",
    "descricao",
    "categoria" AS "category",
    "peso_kg" AS "weight_kg",
    "estoque_atual" AS "stock_quantity",
    "estoque_minimo" AS "stock_min_alert",
    "ativo" AS "is_active",
    "destaque" AS "is_featured",
    (("preco" * (100)::numeric))::integer AS "price_cents",
    "to_char"("preco", 'FM999G990D00'::"text") AS "price_formatted",
    ( SELECT "cat_imagens_produto"."url"
           FROM "public"."cat_imagens_produto"
          WHERE (("cat_imagens_produto"."produto_id" = "p"."id") AND (("cat_imagens_produto"."tipo")::"text" = 'cover'::"text") AND ("cat_imagens_produto"."ativo" = true))
          ORDER BY "cat_imagens_produto"."ordem"
         LIMIT 1) AS "primary_image_url",
    ( SELECT COALESCE("json_agg"("json_build_object"('id', "img"."id", 'url', "img"."url", 'alt_text', "img"."alt_text", 'is_primary', (("img"."tipo")::"text" = 'cover'::"text"), 'sort_order', "img"."ordem") ORDER BY "img"."ordem"), '[]'::json) AS "coalesce"
           FROM "public"."cat_imagens_produto" "img"
          WHERE (("img"."produto_id" = "p"."id") AND ("img"."ativo" = true))) AS "images",
        CASE
            WHEN ("estoque_atual" <= 0) THEN 'Sem Estoque'::"text"
            WHEN ("estoque_atual" <= "estoque_minimo") THEN 'Estoque Baixo'::"text"
            ELSE 'Em Estoque'::"text"
        END AS "stock_status"
   FROM "public"."produtos" "p"
  WHERE ("ativo" = true);


ALTER VIEW "public"."vw_catalogo_produtos" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cat_pedidos" ALTER COLUMN "numero_pedido" SET DEFAULT "nextval"('"public"."cat_pedidos_numero_pedido_seq"'::"regclass");



ALTER TABLE ONLY "public"."cat_imagens_produto"
    ADD CONSTRAINT "cat_imagens_produto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cat_itens_pedido"
    ADD CONSTRAINT "cat_itens_pedido_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cat_pedidos_pendentes_vinculacao"
    ADD CONSTRAINT "cat_pedidos_pendentes_vinculacao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cat_pedidos"
    ADD CONSTRAINT "cat_pedidos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_chave_key" UNIQUE ("chave");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_telefone_key" UNIQUE ("telefone");



ALTER TABLE ONLY "public"."itens_venda"
    ADD CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagamentos_venda"
    ADD CONSTRAINT "pagamentos_venda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plano_de_contas"
    ADD CONSTRAINT "plano_de_contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_payments"
    ADD CONSTRAINT "purchase_order_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sis_imagens_produto"
    ADD CONSTRAINT "sis_imagens_produto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_cat_pedido_id_key" UNIQUE ("cat_pedido_id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_cat_imagens_produto_produto_id" ON "public"."cat_imagens_produto" USING "btree" ("produto_id");



CREATE INDEX "idx_cat_imagens_produto_tipo" ON "public"."cat_imagens_produto" USING "btree" ("tipo");



CREATE INDEX "idx_cat_itens_pedido_pedido" ON "public"."cat_itens_pedido" USING "btree" ("pedido_id");



CREATE INDEX "idx_cat_itens_pedido_produto" ON "public"."cat_itens_pedido" USING "btree" ("produto_id");



CREATE INDEX "idx_cat_pedidos_criado_em" ON "public"."cat_pedidos" USING "btree" ("criado_em" DESC);



CREATE INDEX "idx_cat_pedidos_pendentes_vinculacao_cat_pedido_id" ON "public"."cat_pedidos_pendentes_vinculacao" USING "btree" ("cat_pedido_id");



CREATE INDEX "idx_cat_pedidos_status" ON "public"."cat_pedidos" USING "btree" ("status");



CREATE INDEX "idx_cat_pedidos_telefone" ON "public"."cat_pedidos" USING "btree" ("telefone_cliente");



CREATE INDEX "idx_contatos_fts" ON "public"."contatos" USING "gin" ("fts");



CREATE INDEX "idx_contatos_indicado_por" ON "public"."contatos" USING "btree" ("indicado_por_id");



CREATE INDEX "idx_contatos_status" ON "public"."contatos" USING "btree" ("status");



CREATE INDEX "idx_contatos_tipo" ON "public"."contatos" USING "btree" ("tipo");



CREATE INDEX "idx_itens_venda_produto_id" ON "public"."itens_venda" USING "btree" ("produto_id");



CREATE INDEX "idx_itens_venda_venda" ON "public"."itens_venda" USING "btree" ("venda_id");



CREATE INDEX "idx_itens_venda_venda_id" ON "public"."itens_venda" USING "btree" ("venda_id");



CREATE INDEX "idx_lancamentos_conta_destino_id" ON "public"."lancamentos" USING "btree" ("conta_destino_id");



CREATE INDEX "idx_lancamentos_conta_id" ON "public"."lancamentos" USING "btree" ("conta_id");



CREATE INDEX "idx_lancamentos_plano_conta_id" ON "public"."lancamentos" USING "btree" ("plano_conta_id");



CREATE INDEX "idx_lancamentos_purchase_order_payment_id" ON "public"."lancamentos" USING "btree" ("purchase_order_payment_id");



CREATE INDEX "idx_lancamentos_venda_id" ON "public"."lancamentos" USING "btree" ("venda_id");



CREATE INDEX "idx_pagamentos_venda_venda_id" ON "public"."pagamentos_venda" USING "btree" ("venda_id");



CREATE INDEX "idx_produtos_categoria" ON "public"."produtos" USING "btree" ("categoria");



CREATE INDEX "idx_produtos_destaque" ON "public"."produtos" USING "btree" ("destaque") WHERE ("destaque" = true);



CREATE INDEX "idx_produtos_slug" ON "public"."produtos" USING "btree" ("slug");



CREATE INDEX "idx_purchase_order_items_product_id" ON "public"."purchase_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_purchase_order_items_purchase_order_id" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_purchase_order_payments_order_id" ON "public"."purchase_order_payments" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_purchase_orders_fornecedor_id" ON "public"."purchase_orders" USING "btree" ("fornecedor_id");



CREATE INDEX "idx_sis_imagens_produto_produto_id" ON "public"."sis_imagens_produto" USING "btree" ("produto_id");



CREATE INDEX "idx_vendas_contato" ON "public"."vendas" USING "btree" ("contato_id");



CREATE INDEX "idx_vendas_contato_id" ON "public"."vendas" USING "btree" ("contato_id");



CREATE INDEX "idx_vendas_data" ON "public"."vendas" USING "btree" ("data");



CREATE INDEX "idx_vendas_fts" ON "public"."vendas" USING "gin" ("fts");



CREATE INDEX "idx_vendas_status" ON "public"."vendas" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "tr_sync_cat_pedido_to_venda" AFTER UPDATE ON "public"."cat_pedidos" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_cat_pedido_to_venda"();



CREATE OR REPLACE TRIGGER "tr_update_purchase_order_payment_status" AFTER INSERT OR DELETE OR UPDATE ON "public"."purchase_order_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_purchase_order_payment_status"();



CREATE OR REPLACE TRIGGER "trigger_configuracoes_atualizado_em" BEFORE UPDATE ON "public"."configuracoes" FOR EACH ROW EXECUTE FUNCTION "public"."update_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_contatos_atualizado_em" BEFORE UPDATE ON "public"."contatos" FOR EACH ROW EXECUTE FUNCTION "public"."update_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_produtos_atualizado_em" BEFORE UPDATE ON "public"."produtos" FOR EACH ROW EXECUTE FUNCTION "public"."update_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_stock_on_status_change" AFTER UPDATE OF "status" ON "public"."vendas" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."handle_stock_on_status_change"();



CREATE OR REPLACE TRIGGER "trigger_update_venda_pagamento" AFTER INSERT OR DELETE ON "public"."pagamentos_venda" FOR EACH ROW EXECUTE FUNCTION "public"."update_venda_pagamento_summary"();



CREATE OR REPLACE TRIGGER "trigger_vendas_atualizado_em" BEFORE UPDATE ON "public"."vendas" FOR EACH ROW EXECUTE FUNCTION "public"."update_atualizado_em"();



CREATE OR REPLACE TRIGGER "update_cat_pedidos_atualizado_em" BEFORE UPDATE ON "public"."cat_pedidos" FOR EACH ROW EXECUTE FUNCTION "public"."update_atualizado_em_column"();



ALTER TABLE ONLY "public"."cat_imagens_produto"
    ADD CONSTRAINT "cat_imagens_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cat_itens_pedido"
    ADD CONSTRAINT "cat_itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."cat_pedidos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cat_itens_pedido"
    ADD CONSTRAINT "cat_itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."cat_pedidos_pendentes_vinculacao"
    ADD CONSTRAINT "cat_pedidos_pendentes_vinculacao_cat_pedido_id_fkey" FOREIGN KEY ("cat_pedido_id") REFERENCES "public"."cat_pedidos"("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_indicado_por_id_fkey" FOREIGN KEY ("indicado_por_id") REFERENCES "public"."contatos"("id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."itens_venda"
    ADD CONSTRAINT "itens_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."itens_venda"
    ADD CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."vendas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_conta_destino_id_fkey" FOREIGN KEY ("conta_destino_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_plano_conta_id_fkey" FOREIGN KEY ("plano_conta_id") REFERENCES "public"."plano_de_contas"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_purchase_order_payment_id_fkey" FOREIGN KEY ("purchase_order_payment_id") REFERENCES "public"."purchase_order_payments"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lancamentos"
    ADD CONSTRAINT "lancamentos_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."vendas"("id");



ALTER TABLE ONLY "public"."pagamentos_venda"
    ADD CONSTRAINT "pagamentos_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "public"."vendas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."produtos"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_payments"
    ADD CONSTRAINT "purchase_order_payments_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."contatos"("id");



ALTER TABLE ONLY "public"."sis_imagens_produto"
    ADD CONSTRAINT "sis_imagens_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow delete for all users on sis_imagens_produto" ON "public"."sis_imagens_produto" FOR DELETE USING (true);



CREATE POLICY "Allow insert for all users on sis_imagens_produto" ON "public"."sis_imagens_produto" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select for all users on sis_imagens_produto" ON "public"."sis_imagens_produto" FOR SELECT USING (true);



CREATE POLICY "Allow update for all users on sis_imagens_produto" ON "public"."sis_imagens_produto" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access" ON "public"."purchase_order_items" USING (true);



CREATE POLICY "Enable all access" ON "public"."purchase_orders" USING (true);



CREATE POLICY "Enable all access for all users" ON "public"."purchase_order_payments" USING (true) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."sis_imagens_produto" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."sis_imagens_produto" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."sis_imagens_produto" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."sis_imagens_produto" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Full access for authenticated users" ON "public"."contas" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Full access for authenticated users" ON "public"."contatos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Full access for authenticated users" ON "public"."lancamentos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Full access for authenticated users" ON "public"."plano_de_contas" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Full access for authenticated users" ON "public"."produtos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Full access for authenticated users" ON "public"."vendas" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."cat_itens_pedido" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cat_itens_pedido_admin_total" ON "public"."cat_itens_pedido" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cat_itens_pedido_insercao_publica" ON "public"."cat_itens_pedido" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."cat_pedidos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cat_pedidos_admin_total" ON "public"."cat_pedidos" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "cat_pedidos_insercao_publica" ON "public"."cat_pedidos" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."contas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contatos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lancamentos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plano_de_contas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."produtos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sis_imagens_produto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."fn_sync_cat_pedido_to_venda"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sync_cat_pedido_to_venda"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sync_cat_pedido_to_venda"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stock_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stock_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stock_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."receive_purchase_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."receive_purchase_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."receive_purchase_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_marcar_venda_paga"("p_venda_id" "uuid", "p_conta_id" "uuid", "p_data" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_marcar_venda_paga"("p_venda_id" "uuid", "p_conta_id" "uuid", "p_data" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_marcar_venda_paga"("p_venda_id" "uuid", "p_conta_id" "uuid", "p_data" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_atualizado_em"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_atualizado_em"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_atualizado_em"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_atualizado_em_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_atualizado_em_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_atualizado_em_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_order_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_order_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_order_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_venda_pagamento_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_venda_pagamento_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_venda_pagamento_summary"() TO "service_role";


















GRANT ALL ON TABLE "public"."cat_imagens_produto" TO "anon";
GRANT ALL ON TABLE "public"."cat_imagens_produto" TO "authenticated";
GRANT ALL ON TABLE "public"."cat_imagens_produto" TO "service_role";



GRANT ALL ON TABLE "public"."cat_itens_pedido" TO "anon";
GRANT ALL ON TABLE "public"."cat_itens_pedido" TO "authenticated";
GRANT ALL ON TABLE "public"."cat_itens_pedido" TO "service_role";



GRANT ALL ON TABLE "public"."cat_pedidos" TO "anon";
GRANT ALL ON TABLE "public"."cat_pedidos" TO "authenticated";
GRANT ALL ON TABLE "public"."cat_pedidos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cat_pedidos_numero_pedido_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cat_pedidos_numero_pedido_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cat_pedidos_numero_pedido_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cat_pedidos_pendentes_vinculacao" TO "anon";
GRANT ALL ON TABLE "public"."cat_pedidos_pendentes_vinculacao" TO "authenticated";
GRANT ALL ON TABLE "public"."cat_pedidos_pendentes_vinculacao" TO "service_role";



GRANT ALL ON TABLE "public"."configuracoes" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes" TO "service_role";



GRANT ALL ON TABLE "public"."contas" TO "anon";
GRANT ALL ON TABLE "public"."contas" TO "authenticated";
GRANT ALL ON TABLE "public"."contas" TO "service_role";



GRANT ALL ON TABLE "public"."contatos" TO "anon";
GRANT ALL ON TABLE "public"."contatos" TO "authenticated";
GRANT ALL ON TABLE "public"."contatos" TO "service_role";



GRANT ALL ON TABLE "public"."vendas" TO "anon";
GRANT ALL ON TABLE "public"."vendas" TO "authenticated";
GRANT ALL ON TABLE "public"."vendas" TO "service_role";



GRANT ALL ON TABLE "public"."crm_view_monthly_sales" TO "anon";
GRANT ALL ON TABLE "public"."crm_view_monthly_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_view_monthly_sales" TO "service_role";



GRANT ALL ON TABLE "public"."crm_view_operational_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."crm_view_operational_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_view_operational_snapshot" TO "service_role";



GRANT ALL ON TABLE "public"."itens_venda" TO "anon";
GRANT ALL ON TABLE "public"."itens_venda" TO "authenticated";
GRANT ALL ON TABLE "public"."itens_venda" TO "service_role";



GRANT ALL ON TABLE "public"."lancamentos" TO "anon";
GRANT ALL ON TABLE "public"."lancamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."lancamentos" TO "service_role";



GRANT ALL ON TABLE "public"."pagamentos_venda" TO "anon";
GRANT ALL ON TABLE "public"."pagamentos_venda" TO "authenticated";
GRANT ALL ON TABLE "public"."pagamentos_venda" TO "service_role";



GRANT ALL ON TABLE "public"."plano_de_contas" TO "anon";
GRANT ALL ON TABLE "public"."plano_de_contas" TO "authenticated";
GRANT ALL ON TABLE "public"."plano_de_contas" TO "service_role";



GRANT ALL ON TABLE "public"."produtos" TO "anon";
GRANT ALL ON TABLE "public"."produtos" TO "authenticated";
GRANT ALL ON TABLE "public"."produtos" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_payments" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_payments" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_compras" TO "anon";
GRANT ALL ON TABLE "public"."ranking_compras" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_compras" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_indicacoes" TO "anon";
GRANT ALL ON TABLE "public"."ranking_indicacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_indicacoes" TO "service_role";



GRANT ALL ON TABLE "public"."sis_imagens_produto" TO "anon";
GRANT ALL ON TABLE "public"."sis_imagens_produto" TO "authenticated";
GRANT ALL ON TABLE "public"."sis_imagens_produto" TO "service_role";



GRANT ALL ON TABLE "public"."view_extrato_mensal" TO "anon";
GRANT ALL ON TABLE "public"."view_extrato_mensal" TO "authenticated";
GRANT ALL ON TABLE "public"."view_extrato_mensal" TO "service_role";



GRANT ALL ON TABLE "public"."view_fluxo_resumo" TO "anon";
GRANT ALL ON TABLE "public"."view_fluxo_resumo" TO "authenticated";
GRANT ALL ON TABLE "public"."view_fluxo_resumo" TO "service_role";



GRANT ALL ON TABLE "public"."view_home_alertas" TO "anon";
GRANT ALL ON TABLE "public"."view_home_alertas" TO "authenticated";
GRANT ALL ON TABLE "public"."view_home_alertas" TO "service_role";



GRANT ALL ON TABLE "public"."view_home_financeiro" TO "anon";
GRANT ALL ON TABLE "public"."view_home_financeiro" TO "authenticated";
GRANT ALL ON TABLE "public"."view_home_financeiro" TO "service_role";



GRANT ALL ON TABLE "public"."view_home_operacional" TO "anon";
GRANT ALL ON TABLE "public"."view_home_operacional" TO "authenticated";
GRANT ALL ON TABLE "public"."view_home_operacional" TO "service_role";



GRANT ALL ON TABLE "public"."vw_marketing_pedidos" TO "anon";
GRANT ALL ON TABLE "public"."vw_marketing_pedidos" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_marketing_pedidos" TO "service_role";



GRANT ALL ON TABLE "public"."vw_admin_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."vw_admin_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_admin_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."vw_catalogo_produtos" TO "anon";
GRANT ALL ON TABLE "public"."vw_catalogo_produtos" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_catalogo_produtos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























