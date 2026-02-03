# Banco de Dados (Supabase)

O esquema do banco de dados é relacional (PostgreSQL) e gerenciado via Supabase.

## Tabelas Principais

### `produtos`
Catálogo de produtos vendidos ou comprados.
- `id` (uuid, pk)
- `nome` (text)
- `codigo` (text, unique) - SKU ou código de barras
- `apelido` (text, nullable) - Sigla para facilitar identificação (ex: "B")
- `preco` (numeric) - Preço de venda
- `custo` (numeric) - Custo de aquisição
- `estoque_atual` (numeric)
- `estoque_minimo` (numeric) - Gatilho para alertas de reposição
- `unidade` (text) - Default: 'un'
- `ativo` (boolean)

### `contatos`
Pessoas e empresas (Clientes e Fornecedores).
- `id` (uuid, pk)
- `nome` (text)
- `tipo` (text) - 'B2C' | 'B2B'
- `status` (text) - 'lead' | 'cliente' | 'inativo' | 'fornecedor'
- `telefone` (text)
- `endereco` (text)
- `bairro` (text)
- `cep` (text)
- `indicado_por_id` (uuid, fk -> contatos) - Sistema de indicação

### `vendas`
Registro de saídas (vendas para clientes).
- `id` (uuid, pk)
- `contato_id` (uuid, fk)
- `data` (timestamp)
- `total` (numeric)
- `status` (text) - 'pendente' | 'em_separacao' | 'entregue' | 'cancelada'
- `forma_pagamento` (text) - 'pix' | 'dinheiro' | 'cartao' | 'fiado'
- `pago` (boolean) - Define se financeiro está quitado
- `data_prevista_pagamento` (date) - Para gestão de fiado

### `itens_venda`
Itens transacionados em uma venda.
- `id` (uuid, pk)
- `venda_id` (uuid, fk)
- `produto_id` (uuid, fk)
- `quantidade` (numeric)
- `preco_unitario` (numeric) - Snapshot do preço no momento da venda
- `custo_unitario` (numeric) - Snapshot do custo
- `subtotal` (numeric)

### `pagamentos_venda`
Registro detalhado de pagamentos recebidos (permite pagamentos parciais).
- `id` (uuid, pk)
- `venda_id` (uuid, fk)
- `valor` (numeric)
- `data` (timestamp)
- `metodo` (text)

## Módulo de Compras (Supply Chain)

### `purchase_orders`
Pedidos de compra para fornecedores.
- `id` (uuid, pk)
- `supplier_id` (uuid, fk -> contatos)
- `order_date` (date)
- `status` (enum) - 'pending' | 'received' | 'cancelled'
- `payment_status` (enum) - 'paid' | 'partial' | 'unpaid'
- `total_amount` (numeric)
- `amount_paid` (numeric) - Controle de contas a pagar
- `notes` (text)

### `purchase_order_items`
Itens de um pedido de compra.
- `id` (uuid, pk)
- `purchase_order_id` (uuid, fk)
- `product_id` (uuid, fk)
- `quantity` (numeric)
- `unit_cost` (numeric) - Custo negociado
- `total_cost` (numeric)

### `purchase_order_payments`
Pagamentos realizados a fornecedores.
- `id` (uuid, pk)
- `purchase_order_id` (uuid, fk)
- `amount` (numeric)
- `payment_date` (date)
- `payment_method` (text)

## Views e Funções

*(Acesso via API do Supabase)*

- RLS (Row Level Security) está habilitado em todas as tabelas públicas, permitindo acesso apenas a usuários autenticados (atualmente configurado para política permissiva durante desenvolvimento).
