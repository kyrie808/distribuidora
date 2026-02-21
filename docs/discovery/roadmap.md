# Modernization Roadmap - Gilmar Distribuidor Massas

## Phase 1: Security & Performance (Short term)
- [ ] Task: Enable RLS on `vendas`, `contatos`, `produtos`.
- [ ] Task: Create non-blocking indexes for all Foreign Keys.
- [ ] Task: Verify AuthGuard consistency across all routes.

## Phase 2: Architectural Standardization (Medium term)
- [ ] Task: Refactor Dashboard to use consolidated database views (no client-side math).
- [ ] Task: Migrate direct Supabase calls in hooks to the service layer.
- [ ] Task: Standardize naming conventions for timestamp and ID columns.

## Phase 3: UX & Scalability (Long term)
- [ ] Task: Refactor `NovaVenda` into a multi-step wizard for better mobile usability.
- [ ] Task: Implement advanced filtering and search on all list pages using Supabase `textSearch`.
- [ ] Task: Database partitioning strategy for `lancamentos` if volume exceeds 1GB.

## Success Metrics
- **Performance**: Dashboard load time < 500ms.
- **Security**: 100% RLS coverage on public schema.
- **Maintainability**: Zero direct Supabase calls outside of the service layer.
