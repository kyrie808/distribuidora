-- Migration 6: Add missing indexes for Foreign Keys
-- Targets performance optimization for large joins

CREATE INDEX IF NOT EXISTS idx_cat_pedidos_contato_id 
    ON public.cat_pedidos(contato_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_conta_id 
    ON public.purchase_order_payments(conta_id);
