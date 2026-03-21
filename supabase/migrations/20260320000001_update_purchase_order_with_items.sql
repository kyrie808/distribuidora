-- RPC: update_purchase_order_with_items
-- Atomically updates a purchase_order header + replaces all its items.
-- DELETE + INSERT run inside a single transaction; if INSERT fails the DELETE is rolled back.

CREATE OR REPLACE FUNCTION public.update_purchase_order_with_items(
    p_order_id       UUID,
    p_fornecedor_id  UUID,
    p_order_date     DATE,
    p_total_amount   NUMERIC,
    p_notes          TEXT,
    p_status         TEXT,
    p_payment_status TEXT,
    p_items          JSONB   -- array of {product_id, quantity, unit_cost}
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Update the order header
    UPDATE purchase_orders
    SET
        fornecedor_id  = p_fornecedor_id,
        order_date     = p_order_date,
        total_amount   = p_total_amount,
        notes          = p_notes,
        status         = p_status::purchase_order_status,
        payment_status = p_payment_status::purchase_order_payment_status
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'purchase_order % not found', p_order_id;
    END IF;

    -- 2. Delete existing items
    DELETE FROM purchase_order_items
    WHERE purchase_order_id = p_order_id;

    -- 3. Insert new items (will raise and roll back everything if invalid)
    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
    SELECT
        p_order_id,
        (item->>'product_id')::UUID,
        (item->>'quantity')::NUMERIC,
        (item->>'unit_cost')::NUMERIC
    FROM jsonb_array_elements(p_items) AS item;

END;
$$;
