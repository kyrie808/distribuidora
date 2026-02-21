# Database Schema: Distribuidora

## 1. Overview
The database is hosted on Supabase and follows a relational structure for a commercial and financial management system.

## 2. Core Tables
### 2.1 CRM / Sales
- **contatos**: Customers and suppliers (B2C, B2B, FORNECEDOR).
- **vendas**: Main sales records (origem: direto, catalogo).
- **itens_venda**: Line items for each sale.
- **pagamentos_venda**: Payments recorded against sales.

### 2.2 Inventory / Catalog
- **produtos**: Product catalog with inventory tracking (estoque_atual, estoque_minimo).
- **sis_imagens_produto**: Internal and catalog images for products.
- **cat_pedidos / cat_itens_pedido**: Specific tables for the online catalog integration.

### 2.3 Financial
- **contas**: Cash/Bank accounts (dinheiro, pix, banco).
- **plano_de_contas**: Categories for financial entries (receitas/despesas).
- **lancamentos**: Financial transactions (manual, venda, compra_fabrica).

### 2.4 Procurement
- **purchase_orders**: Supplier orders.
- **purchase_order_items**: Items in procurement orders.
- **purchase_order_payments**: Payments to suppliers.

## 3. Key Relationships
- `vendas` -> `contatos` (Cliente)
- `itens_venda` -> `vendas` & `produtos`
- `lancamentos` -> `vendas` (Optional linkage for automated entries)
- `purchase_orders` -> `contatos` (Fornecedor)

## 4. Views & Functions
- **Views**: `ranking_compras`, `view_home_financeiro`, `view_extrato_mensal`, etc. (Many used for dashboard KPIs).
- **Functions**: `rpc_marcar_venda_paga`, `receive_purchase_order`, etc.
