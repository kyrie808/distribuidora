-- ============================================================
-- MÓDULO CONTAS A PAGAR — Tabelas, Triggers, RPC, Views, RLS
-- ============================================================

-- ============================================================
-- ETAPA 2: TABELAS
-- ============================================================

-- Tabela principal: obrigações financeiras
CREATE TABLE public.contas_a_pagar (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao        TEXT NOT NULL,
    credor           TEXT NOT NULL,
    valor_total      NUMERIC(12,2) NOT NULL CHECK (valor_total > 0),
    valor_pago       NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_devedor    NUMERIC(12,2) GENERATED ALWAYS AS (valor_total - valor_pago) STORED,
    data_emissao     DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento  DATE NOT NULL,
    parcela_atual    INTEGER DEFAULT 1,
    total_parcelas   INTEGER DEFAULT 1,
    status           TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente', 'parcial', 'pago', 'vencido')),
    plano_conta_id   UUID NOT NULL REFERENCES public.plano_de_contas(id),
    referencia       TEXT,
    observacao       TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    created_by       UUID REFERENCES auth.users(id),
    updated_by       UUID REFERENCES auth.users(id),
    criado_em        TIMESTAMPTZ DEFAULT now(),
    atualizado_em    TIMESTAMPTZ DEFAULT now()
);

-- Tabela de pagamentos (amortizações)
CREATE TABLE public.pagamentos_conta_a_pagar (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_a_pagar_id   UUID NOT NULL REFERENCES public.contas_a_pagar(id) ON DELETE CASCADE,
    valor              NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data_pagamento     DATE NOT NULL DEFAULT CURRENT_DATE,
    conta_id           UUID NOT NULL REFERENCES public.contas(id),
    metodo_pagamento   TEXT NOT NULL DEFAULT 'pix'
                       CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'transferencia')),
    observacao         TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    created_by         UUID REFERENCES auth.users(id),
    criado_em          TIMESTAMPTZ DEFAULT now(),
    atualizado_em      TIMESTAMPTZ DEFAULT now(),
    updated_by         UUID REFERENCES auth.users(id)
);

-- ============================================================
-- ETAPA 3: TRIGGERS
-- ============================================================

-- 3a. Recalcula valor_pago e status após INSERT/DELETE de pagamento
CREATE OR REPLACE FUNCTION public.update_conta_a_pagar_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    v_valor_total  NUMERIC;
    v_total_pago   NUMERIC;
    v_cap_id       UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_cap_id := OLD.conta_a_pagar_id;
    ELSE
        v_cap_id := NEW.conta_a_pagar_id;
    END IF;

    SELECT valor_total INTO v_valor_total
    FROM public.contas_a_pagar
    WHERE id = v_cap_id;

    SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
    FROM public.pagamentos_conta_a_pagar
    WHERE conta_a_pagar_id = v_cap_id;

    UPDATE public.contas_a_pagar
    SET
        valor_pago = v_total_pago,
        status = CASE
            WHEN ROUND(v_total_pago::numeric, 2) >= ROUND(v_valor_total::numeric, 2) THEN 'pago'
            WHEN v_total_pago > 0 THEN 'parcial'
            ELSE 'pendente'
        END
    WHERE id = v_cap_id;

    RETURN NULL;
END;
$$;

CREATE TRIGGER tr_update_conta_a_pagar_status
    AFTER INSERT OR DELETE ON public.pagamentos_conta_a_pagar
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conta_a_pagar_status();

-- 3b. Debita/credita contas.saldo_atual
CREATE OR REPLACE FUNCTION public.update_conta_saldo_cap_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
            WHERE id = NEW.conta_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
            WHERE id = OLD.conta_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
            WHERE id = OLD.conta_id;
        END IF;
        IF (NEW.conta_id IS NOT NULL) THEN
            UPDATE contas SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
            WHERE id = NEW.conta_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER tr_pagamento_cap_saldo
    AFTER INSERT OR DELETE OR UPDATE ON public.pagamentos_conta_a_pagar
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conta_saldo_cap_payment();

-- 3c. Audit triggers
CREATE TRIGGER tr_contas_a_pagar_audit
    BEFORE INSERT OR UPDATE ON public.contas_a_pagar
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER tr_pagamentos_cap_audit
    BEFORE INSERT OR UPDATE ON public.pagamentos_conta_a_pagar
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_audit_fields();

-- ============================================================
-- ETAPA 4: RPC — registrar_pagamento_conta_a_pagar
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_pagamento_conta_a_pagar(
    p_conta_a_pagar_id UUID,
    p_valor            NUMERIC,
    p_data_pagamento   DATE,
    p_conta_id         UUID,
    p_metodo_pagamento TEXT DEFAULT 'pix',
    p_observacao       TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_cap              RECORD;
    v_lancamento_id    UUID;
BEGIN
    SELECT id, descricao, credor, valor_total, valor_pago, saldo_devedor, status, plano_conta_id
    INTO v_cap
    FROM public.contas_a_pagar
    WHERE id = p_conta_a_pagar_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conta a pagar % não encontrada', p_conta_a_pagar_id;
    END IF;

    IF v_cap.status = 'pago' THEN
        RAISE EXCEPTION 'Esta obrigação já está totalmente paga';
    END IF;

    IF ROUND(p_valor::numeric, 2) > ROUND(v_cap.saldo_devedor::numeric, 2) THEN
        RAISE EXCEPTION 'Valor do pagamento (%) excede o saldo devedor (%)',
            p_valor, v_cap.saldo_devedor;
    END IF;

    INSERT INTO public.pagamentos_conta_a_pagar (
        conta_a_pagar_id, valor, data_pagamento, conta_id, metodo_pagamento, observacao
    ) VALUES (
        p_conta_a_pagar_id, p_valor, p_data_pagamento, p_conta_id, p_metodo_pagamento, p_observacao
    );

    INSERT INTO public.lancamentos (
        data, descricao, valor, tipo, conta_id, plano_conta_id, origem
    ) VALUES (
        p_data_pagamento,
        'Pgto ' || v_cap.credor || ' - ' || v_cap.descricao,
        p_valor,
        'saida',
        p_conta_id,
        v_cap.plano_conta_id,
        'contas_a_pagar'
    )
    RETURNING id INTO v_lancamento_id;

    RETURN v_lancamento_id;
END;
$$;

-- ============================================================
-- ETAPA 5: VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.rpt_projecao_pagamentos AS
SELECT
    cap.id AS conta_a_pagar_id,
    cap.descricao,
    cap.credor,
    cap.valor_total,
    cap.valor_pago,
    cap.saldo_devedor,
    cap.data_vencimento,
    cap.parcela_atual,
    cap.total_parcelas,
    cap.plano_conta_id,
    pdc.nome AS categoria_nome,
    cap.referencia,
    CASE
        WHEN cap.data_vencimento < CURRENT_DATE THEN 'vencido'
        WHEN cap.data_vencimento = CURRENT_DATE THEN 'vence_hoje'
        WHEN cap.data_vencimento <= (CURRENT_DATE + INTERVAL '7 days') THEN 'proximos_7_dias'
        WHEN cap.data_vencimento <= (CURRENT_DATE + INTERVAL '30 days') THEN 'proximos_30_dias'
        ELSE 'futuro'
    END AS situacao,
    CASE
        WHEN cap.data_vencimento < CURRENT_DATE
        THEN (CURRENT_DATE - cap.data_vencimento)
        ELSE 0
    END AS dias_atraso
FROM public.contas_a_pagar cap
LEFT JOIN public.plano_de_contas pdc ON pdc.id = cap.plano_conta_id
WHERE cap.status <> 'pago'
ORDER BY cap.data_vencimento;

CREATE OR REPLACE VIEW public.view_contas_a_pagar_dashboard AS
SELECT
    COALESCE(SUM(saldo_devedor), 0) AS total_a_pagar,
    COALESCE(SUM(CASE WHEN data_vencimento < CURRENT_DATE THEN saldo_devedor ELSE 0 END), 0) AS total_vencido,
    COUNT(*) FILTER (WHERE status IN ('pendente', 'parcial')) AS qtd_pendentes,
    COUNT(*) FILTER (WHERE data_vencimento < CURRENT_DATE AND status <> 'pago') AS qtd_vencidas
FROM public.contas_a_pagar
WHERE status <> 'pago';

-- ============================================================
-- ETAPA 6: RLS
-- ============================================================

ALTER TABLE public.contas_a_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_conta_a_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage contas_a_pagar"
    ON public.contas_a_pagar
    FOR ALL
    USING (( SELECT is_admin() ))
    WITH CHECK (( SELECT is_admin() ));

CREATE POLICY "Admin manage pagamentos_conta_a_pagar"
    ON public.pagamentos_conta_a_pagar
    FOR ALL
    USING (( SELECT is_admin() ))
    WITH CHECK (( SELECT is_admin() ));

NOTIFY pgrst, 'reload schema';
