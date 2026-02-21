# Database Schema Audit - Gilmar Distribuidor Massas

## Executive Summary
The database schema is generally well-structured with primary keys and foreign key constraints on all tables. However, there is significant technical debt regarding performance (missing indexes) and naming consistency.

**Audit Date**: 2026-02-20
**Overall Score**: 75/100

## Core Findings

### 1. Primary Keys & Integrity
- [x] All tables have Primary Keys (UUID).
- [x] Foreign key constraints are present for all relational fields.

### 2. Performance Issues (Critical)
Many foreign keys lack indexes, which will lead to slow performance as the data grows:
- `lancamentos (conta_id, conta_destino_id, plano_conta_id, venda_id)`
- `itens_venda (produto_id)`
- `purchase_orders (fornecedor_id)`
- `purchase_order_items (purchase_order_id, product_id)`
- `pagamentos_venda (venda_id)`

### 3. Database Logic (Triggers & Functions)
The system relies on several triggers and RPCs for business logic:
- `rpc_marcar_venda_paga`: Handles complex payment logic.
- `handle_stock_on_status_change`: Automates inventory management.
- `fn_sync_cat_pedido_to_venda`: Integrates the online catalog with the sales system.
- `update_venda_pagamento_summary`: Keeps denormalized payment data in sync.

## Recommendations

### High Priority
1. **Index Foreign Keys**: Create indexes for all FKs listed in the performance section.
2. **Standardize Naming**: Resolve inconsistencies between `created_at` (camelCase vs snake_case) and naming of ID fields across different modules.

### Medium Priority
1. **Audit Timestamps**: Ensure `atualizado_em` / `updated_at` is consistently applied to all tables via triggers.
2. **Type Safety**: Move from check constraints to Enums for complex states where appropriate.
