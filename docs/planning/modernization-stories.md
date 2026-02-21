# Modernization Stories - Phase 1: Security & Performance

This document breaks down the Phase 1 tasks into actionable user stories for development.

## [EPIC] Phase 1: Foundation Hardening

### Story 1: Database Security - Enable RLS for Core Tables
**ID**: STORY-001
**Role**: Data Engineer / Backend Developer
**Effort**: 4 Points (Medium)

**User Story**:
As an administrator, I want core data (sales, contacts, products) to be protected by Row Level Security so that only authenticated users can access sensitive business information.

**Acceptance Criteria**:
- [ ] RLS is enabled for `vendas`, `contatos`, and `produtos` tables.
- [ ] A policy is created allowing `authenticated` roles to perform SELECT, INSERT, UPDATE, and DELETE operations.
- [ ] Direct access via the anon key (unauthenticated) returns no records for these tables.
- [ ] Application functionality (fetching sales/contacts/products) remains intact after RLS enablement.

---

### Story 2: Performance Optimization - Foreign Key Indexing
**ID**: STORY-002
**Role**: Data Engineer
**Effort**: 2 Points (Small)

**User Story**:
As a system, I want all foreign key columns to be indexed so that complex JOIN queries and data deletions are processed efficiently as the database grows.

**Acceptance Criteria**:
- [ ] Non-blocking indexes (CONCURRENTLY) are created for all foreign keys identified in the audit:
    - `lancamentos (conta_id, conta_destino_id, plano_conta_id, venda_id)`
    - `itens_venda (produto_id)`
    - `purchase_orders (fornecedor_id)`
    - `purchase_order_items (purchase_order_id, product_id)`
    - `pagamentos_venda (venda_id)`
- [ ] Verification query confirms no foreign keys are left without an associated index.

---

### Story 3: Frontend Security - AuthGuard Consistency Audit
**ID**: STORY-003
**Role**: Frontend Developer
**Effort**: 1 Point (Small)

**User Story**:
As a user, I want all internal application pages to be behind an authentication wall so that my business tools are not exposed to the public web.

**Acceptance Criteria**:
- [ ] Audit `src/App.tsx` and verify that all routes except `/login` are wrapped in the `AuthGuard` component.
- [ ] Manual test: Attempting to access `/vendas` or `/dashboard` while logged out redirects to `/login`.
- [ ] Ensure that no internal components are accidentally rendered outside the `AuthGuard` scope.

---

## Summary of Effort
| ID | Title | Points |
|----|-------|--------|
| STORY-001 | Enable RLS for Core Tables | 4 |
| STORY-002 | FK Indexing | 2 |
| STORY-003 | AuthGuard Audit | 1 |
| **Total** | | **7 Points** |
