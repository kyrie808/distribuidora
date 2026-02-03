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
- `criado_em` (timestamp)
- `atualizado_em` (timestamp)

### `contatos`
Pessoas e empresas (Clientes e Fornecedores).
- `id` (uuid, pk)
- `nome` (text)
- `tipo` (text) - 'B2C' | 'B2B'
- `subtipo` (text, nullable)
- `status` (text) - 'lead' | 'cliente' | 'inativo' | 'fornecedor'
- `telefone` (text, unique)
- `endereco` (text, nullable)
- `bairro` (text, nullable)
- `cep` (text, nullable)
- `latitude` (float8, nullable)
- `longitude` (float8, nullable)
- `indicado_por_id` (uuid, fk -> contatos) - Sistema de indicação
- `observacoes` (text, nullable)
- `ultimo_contato` (timestamp, nullable)
- `criado_em` (timestamp)
- `atualizado_em` (timestamp)

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
- `taxa_entrega` (numeric, default 0)
- `criado_em` (timestamp)

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
- `metodo` (text) - 'pix', etc
- `observacao` (text, nullable)
- `criado_em` (timestamp)

## Módulo de Compras (Supply Chain)

### `purchase_orders`
Pedidos de compra para fornecedores.
- `id` (uuid, pk)
- `supplier_id` (uuid, fk -> contatos)
- `status` (text) - 'pending' | 'ordered' | 'received' | 'cancelled'
- `total_amount` (numeric)
- `order_date` (timestamp)
- `expected_delivery_date` (timestamp)
- `notes` (text)
- `payment_status` (text) - 'unpaid' | 'partial' | 'paid'
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `purchase_order_items`
Itens de um pedido de compra.
- `id` (uuid, pk)
- `purchase_order_id` (uuid, fk)
- `product_id` (uuid, fk)
- `quantity` (numeric)
- `unit_cost` (numeric)
- `total_cost` (numeric)

### `purchase_order_payments`
Pagamentos realizados a fornecedores.
- `id` (uuid, pk)
- `purchase_order_id` (uuid, fk)
- `amount` (numeric)
- `payment_date` (timestamp)
- `payment_method` (text)
- `notes` (text)
- `created_at` (timestamp)
