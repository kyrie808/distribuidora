# Specialist Review: QA Specialist 🧪

## 1. Testing Framework Stack
- **Recommendation**: **Vitest** for unit/integration tests and **Playwright** for E2E tests.
- **Rationale**: Vitest integrates seamlessly with the existing Vite setup. Playwright is superior for testing PWA and mobile-responsive behaviors across Safari/Chrome.

## 2. Initial Testing Targets
- **High Priority (E2E)**:
  1. **Login & Session**: Ensuring Auth works across sessions.
  2. **Sales Flow**: Success path for `Nova Venda`.
  3. **Inventory Sync**: Verifying stock decrements correctly after a sale.
- **High Priority (Unit)**:
  1. **Currency/Date Formatters**: Critical for financial accuracy.
  2. **Service Mappers**: Ensuring DB -> Domain transformations are bug-free.

## 3. CI/CD Integration
- **Recommendation**: Integrate these tests into GitHub Actions (or Vercel previews) to prevent regressions, particularly given the lack of RLS currently.

## 4. Verification Check
- The `technical-debt-DRAFT.md` correctly identifies the lack of tests.
- Suggested Metric: Aim for 40% coverage on data-critical hooks (`useVendas`, `useDashboardMetrics`) in the first sprint.
