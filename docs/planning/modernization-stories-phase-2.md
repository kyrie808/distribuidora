# Modernization Stories - Phase 2: Architectural Standardization & Cleanup

## STORY-004: Standardize Dashboard Data Flow
**As a** developer,
**I want to** move the Supabase logic from `useDashboardMetrics` to a new `dashboardService`,
**So that** the data access layer is centralized and easier to maintain.

### Acceptance Criteria
- [ ] New `dashboardService.ts` created with a `getDashboardMetrics` function.
- [ ] Otimização de queries consolidadas via `Promise.all` preservada no service.
- [ ] `useDashboardMetrics.ts` refactored to call `dashboardService`.
- [ ] Direct `supabase` import removed from `useDashboardMetrics.ts`.
- [ ] Dashboard UI continues to display correct real-time data.

---

## STORY-005: Fix Core Type Exports and Inconsistencies
**As a** developer,
**I want to** resolve the 37 TypeScript errors by standardizing types and exports in `src/types/database.ts`,
**So that** the project has a stable foundation for further development.

### Acceptance Criteria
- [ ] `src/types/database.ts` updated with missing exports (`VendaComItens`, `PurchaseOrderWithItems`, etc.).
- [ ] `mappers.ts` property errors resolved.
- [ ] `ContatoFormModal.tsx` type mismatches for `tipo` and `Partial` resolved.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` returns zero errors.

---

## STORY-006: Refactor Critical Operational Hooks
**As a** developer,
**I want to** migrate Supabase calls from `useLogistica`, `useRecompra`, and `usePurchaseOrders` to the service layer,
**So that** the architectural pattern is consistent across all core modules.

### Acceptance Criteria
- [ ] `useLogistica.ts`, `useRecompra.ts`, and `usePurchaseOrders.ts` no longer import `supabase` directly.
- [ ] Respective services (or new ones) handle the database interactions.
- [ ] No regression in functionality for Logistics, Repurchase alerts, or Purchase Orders.
