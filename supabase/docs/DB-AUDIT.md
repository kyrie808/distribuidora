# Database Audit: Distribuidora

## 1. Security Assessment (RLS)
> [!CAUTION]
> **Critical Security Debt**: Row Level Security (RLS) is DISABLED on the majority of core public tables.

| Table Name | RLS Enabled | Risk Level |
|------------|-------------|------------|
| `contatos` | ❌ No | High |
| `vendas` | ❌ No | High |
| `produtos` | ❌ No | Medium |
| `itens_venda` | ❌ No | High |
| `contas` | ❌ No | High |
| `lancamentos` | ❌ No | High |
| `plano_de_contas` | ❌ No | Medium |
| `pagamentos_venda` | ❌ No | High |
| `purchase_orders` | ✅ Yes | Low |

### Vulnerability: Security Definer Views
The following views are defined with `SECURITY DEFINER`, which may bypass RLS policies if not implemented with `search_path` and cautious logic:
- `ranking_compras`
- `view_home_financeiro`
- `view_extrato_mensal`
- `vw_catalogo_produtos`
- ... (Total of 12 views identified)

## 2. Structural & Performance Debt
### Missing Constraints
- Many tables use `text` for enum-like fields without strictly enforced foreign keys to lookup tables, though `check` constraints are used in some (`contatos.tipo`, `vendas.forma_pagamento`).

### Potential Data Integrity
- No soft delete mechanism identified; deletions are likely permanent.
- `inventory` updates rely on RPC functions (`receive_purchase_order`); manual updates to `produtos.estoque_atual` are possible but risky without triggers.

## 3. Migration Status
- 38 migrations identified in `history`.
- Recent migrations (Feb 2026) focus on Catalog Integration and Financial Flow.

## 4. Recommendations
1. **Enable RLS** on ALL public tables immediately.
2. **Define strict RLS policies** (e.g., restricted to `authenticated` users).
3. **Refactor Views**: Migrate `SECURITY DEFINER` views to `SECURITY INVOKER` where possible.
4. **Fix Function Search Paths**: Add `SET search_path = public` to all security-critical functions.
