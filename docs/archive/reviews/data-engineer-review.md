# Specialist Review: Data Engineering 🛠️

## 1. Security Analysis (RLS)
The enabling of RLS is **urgent and non-negotiable**.
- **Impact on Frontend**: Existing services using `.select()` will return empty arrays instead of data unless policies are defined. Transition must be phased:
  1. Enable RLS (Default Deny).
  2. Create `authenticated` policies: `using (auth.role() = 'authenticated')`.
  3. Verify Sales/CRM logic.
- **Security Definer Views**: These view definitions should be reviewed to include `SET search_path = public` to prevent `search_path` hijacking.

## 2. Inventory Consistency
- **Risk**: `produtos.estoque_atual` being updated via direct increments in the app is fragile.
- **Recommendation**: Implement a `Trigger` on `itens_venda` (INSERT/DELETE) that automatically adjusts `produtos.estoque_atual`. This ensures consistency even if a client-side transaction fails.

## 3. Data Retention & Recovery
- **Recommendation**: Implement Soft Deletes (`deleted_at` column) on `contatos` and `vendas`. 
- **Migration Strategy**: Use a base view logic that filters out `deleted_at IS NOT NULL` to maintain compatibility with existing queries.

## 4. Verification of Consolidation
- The `technical-debt-DRAFT.md` correctly identifies the lack of constraints.
- Suggestion: Standardize enums using `check` constraints or dedicated lookup tables for `status` and `tipo` fields across all modules.
