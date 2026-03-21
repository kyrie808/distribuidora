-- Adicionar 'contas_a_pagar' como origem válida em lancamentos
ALTER TABLE public.lancamentos DROP CONSTRAINT chk_lancamentos_origem;
ALTER TABLE public.lancamentos ADD CONSTRAINT chk_lancamentos_origem
    CHECK (origem IN ('manual', 'venda', 'brinde', 'migracao_historica', 'transferencia', 'contas_a_pagar'));
