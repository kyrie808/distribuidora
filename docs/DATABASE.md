# Banco de Dados

**Projeto Supabase:** `distribuidora-prod`  
**Project ID:** `herlvujykltxnwqmwmyx`

---

## Tabelas

### contatos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK, auto-generated |
| `nome` | TEXT | Nome completo |
| `telefone` | TEXT | Telefone (único) |
| `tipo` | TEXT | `B2C` ou `B2B` |
| `subtipo` | TEXT | Subtipo B2B (padaria, restaurante, etc) |
| `status` | TEXT | `lead`, `cliente`, `inativo` |
| `origem` | TEXT | `direto` ou `indicacao` |
| `indicado_por_id` | UUID | FK → contatos.id |
| `endereco` | TEXT | Endereço completo |
| `bairro` | TEXT | Bairro |
| `observacoes` | TEXT | Notas livres |
| `ultimo_contato` | TIMESTAMPTZ | Data do último contato |
| `criado_em` | TIMESTAMPTZ | Data de criação |
| `atualizado_em` | TIMESTAMPTZ | Data de atualização |

**Índices:**
- `idx_contatos_status`
- `idx_contatos_tipo`
- `idx_contatos_indicado_por`

---

### produtos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `nome` | TEXT | Nome do produto |
| `codigo` | TEXT | Código interno (único) |
| `preco` | DECIMAL(10,2) | Preço de venda |
| `custo` | DECIMAL(10,2) | Custo |
| `unidade` | TEXT | Unidade (kg, un, etc) |
| `ativo` | BOOLEAN | Produto ativo? |
| `criado_em` | TIMESTAMPTZ | |
| `atualizado_em` | TIMESTAMPTZ | |

**Seed inicial:**
- Massa Pão de Queijo 1kg (R$ 21,99)
- Massa Pão de Queijo 4kg (R$ 59,90)

---

### vendas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `contato_id` | UUID | FK → contatos.id |
| `data` | DATE | Data da venda |
| `data_entrega` | DATE | Data prevista de entrega |
| `total` | DECIMAL(10,2) | Valor total |
| `forma_pagamento` | TEXT
### 6. pagamentos_venda
Registra pagamentos parciais ou totais de uma venda.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | uuid | Sim | PK |
| venda_id | uuid | Sim | FK -> vendas.id |
| valor | numeric | Sim | Valor do pagamento |
| data | date | Sim | Data do pagamento |
| metodo | text | Sim | Pix, Dinheiro, Cartão, etc. |
| observacao | text | Não | Notas opcionais |
| criado_em | timestamp | Sim | Default: now() |

### 7. purchase_orders
Pedidos de compra aos fornecedores.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | Sim | PK |
| `supplier_id` | uuid | Não | FK -> contatos.id |
| `order_date` | date | Sim | Data do pedido |
| `status` | enum | Sim | `pending`, `received`, `cancelled` |
| `payment_status` | enum | Sim | `paid`, `partial`, `unpaid` |
| `total_amount` | numeric | Sim | Valor total do pedido |
| `amount_paid` | numeric | Sim | Total já pago (Auto-calc trigger) |
| `notes` | text | Não | Observações |
| `received_date` | timestamp | Não | Data de recebimento |
| `created_at` | timestamp | Sim | Default: now() |

### 8. purchase_order_items
Itens de um pedido de compra.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | Sim | PK |
| `purchase_order_id` | uuid | Sim | FK -> purchase_orders.id |
| `product_id` | uuid | Sim | FK -> produtos.id |
| `quantity` | numeric | Sim | Quantidade comprada |
| `unit_cost` | numeric | Sim | Custo unitário |
| `total_cost` | numeric | Sim | Custo total (qtd * unit) |

### 9. purchase_order_payments
Registra pagamentos parciais ou totais de um pedido de compra.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | Sim | PK |
| `purchase_order_id` | uuid | Sim | FK -> purchase_orders.id |
| `amount` | numeric | Sim | Valor pago |
| `payment_date` | timestamp | Sim | Data do pagamento |
| `payment_method` | text | Não | Default: 'pix' |
| `notes` | text | Não | Observações |
| `created_at` | timestamp | Sim | Default: now() |

### 10. pagamentos_venda
Registra pagamentos parciais ou totais de uma venda.

| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | Sim | PK |
| `venda_id` | uuid | Sim | FK -> vendas.id |
| `valor` | numeric | Sim | Valor do pagamento |
| `data` | timestamp | Sim | Data do pagamento |
| `metodo` | text | Sim | Default: 'pix' |
| `observacao` | text | Não | Notas opcionais |
| `criado_em` | timestamp | Sim | Default: now() |

## Enums (PostgreSQL)

### purchase_order_status
- `pending`: Pendente
- `received`: Recebido
- `cancelled`: Cancelado

### purchase_order_payment_status
- `paid`: Pago (Quitado)
- `partial`: Parcialmente Pago
- `unpaid`: Não Pago (Em Aberto)

## Triggers

### 1. Atualizar Estoque (Vendas)
- **Quando:** INSERT em `itens_venda` / UPDATE status `vendas`
- **Ação:** Deduz estoque em `produtos`

### 2. Atualizar Status/Total Pago (Vendas)
- **Quando:** INSERT/UPDATE/DELETE em `pagamentos_venda`
- **Ação:** Recalcula `vendas.valor_pago` e define `vendas.pago`

### 3. Atualizar Status/Total Pago (Pedidos Compra)
- **Quando:** INSERT/UPDATE/DELETE em `purchase_order_payments`
- **Ação:** Recalcula `purchase_orders.amount_paid` e define `purchase_orders.payment_status`
| `status` | TEXT | `pendente`, `entregue`, `cancelada` |
| `observacoes` | TEXT | |
| `criado_em` | TIMESTAMPTZ | |
| `atualizado_em` | TIMESTAMPTZ | |

**Índices:**
- `idx_vendas_contato`
- `idx_vendas_data`
- `idx_vendas_status`

---

### itens_venda

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `venda_id` | UUID | FK → vendas.id |
| `produto_id` | UUID | FK → produtos.id |
| `quantidade` | DECIMAL(10,3) | Quantidade |
| `preco_unitario` | DECIMAL(10,2) | Preço no momento da venda |
| `subtotal` | DECIMAL(10,2) | quantidade × preço_unitario |

**Índices:**
- `idx_itens_venda_venda`

---

### configuracoes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `chave` | TEXT | Nome da config (único) |
| `valor` | JSONB | Valor em JSON |
| `criado_em` | TIMESTAMPTZ | |
| `atualizado_em` | TIMESTAMPTZ | |

**Seed inicial:**
- `ciclo_recompra`: `{"b2c": 15, "b2b": 7}`
- `recompensa_indicacao`: `{"tipo": "desconto", "valor": 5}`
- `mensagem_recompra`: template de mensagem
- `taxa_entrega_padrao`: `{"valor": 0}`

---

## Triggers

### `update_atualizado_em()`

Atualiza `atualizado_em = NOW()` automaticamente em:
- `contatos`
- `produtos`
- `vendas`
- `configuracoes`

---

## Queries Frequentes

```sql
-- Buscar contatos por nome/telefone
SELECT * FROM contatos 
WHERE nome ILIKE '%termo%' OR telefone ILIKE '%termo%'
ORDER BY criado_em DESC;

-- Vendas do mês atual
SELECT * FROM vendas 
WHERE date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
  AND status != 'cancelada';

-- Faturamento do mês
SELECT SUM(total) FROM vendas 
WHERE date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
  AND status != 'cancelada';

-- Contatos para recompra (B2C > 15 dias, B2B > 7 dias)
SELECT c.*, 
  CURRENT_DATE - c.ultimo_contato::date AS dias_sem_compra
FROM contatos c
WHERE c.status = 'cliente'
  AND (
    (c.tipo = 'B2C' AND c.ultimo_contato < CURRENT_DATE - 15)
    OR (c.tipo = 'B2B' AND c.ultimo_contato < CURRENT_DATE - 7)
  );
```

---

## Views (Futuro)

- `vw_recompra_pendente` - Contatos para recontatar
- `vw_top_indicadores` - Ranking de indicadores
- `vw_vendas_por_periodo` - Agregações de vendas
