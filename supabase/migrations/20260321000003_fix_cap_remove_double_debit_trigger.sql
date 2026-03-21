-- Remove o trigger de saldo direto em pagamentos_conta_a_pagar.
-- O saldo da conta é gerido pelo lançamento criado pela RPC registrar_pagamento_conta_a_pagar,
-- que dispara tr_lancamentos_saldo automaticamente.
-- Manter este trigger causaria double debit.
-- Pattern: mesmo de registrar_pagamento_venda (saldo via lancamentos, não via trigger direto).

DROP TRIGGER IF EXISTS tr_pagamento_cap_saldo ON public.pagamentos_conta_a_pagar;
DROP FUNCTION IF EXISTS public.update_conta_saldo_cap_payment();
