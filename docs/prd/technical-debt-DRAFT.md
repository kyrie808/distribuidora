# Technical Debt Assessment (DRAFT)

## 1. Executive Summary
This document consolidates the findings from the Brownfield Discovery data collection phase. The project demonstrates a strong architectural foundation (Service Layer, React 19, Supabase) but suffers from high-risk security debt and a lack of automated internal controls.

## 2. Critical Risk: Security (Databases)
> [!CAUTION]
> **RLS is disabled on 90% of core tables.**
> This means any authenticated user (or even anonymous users depending on API keys) could potentially bypass intended logic via direct API calls.

- **Vulnerability**: 12 `SECURITY DEFINER` views identified that may expose data unsafely.
- **Action Required**: Enable RLS on `contatos`, `vendas`, `lancamentos`, etc., and define restrictive policies.

## 3. Architectural Debt
- **Reliability**: Zero automated tests (unit, integration, or E2E). This makes refactoring risky.
- **Environment Handling**: Hardcoded `127.0.0.1` proxies in `vite.config.ts`.
- **Maintainability**: Extensive manual data mapping (`mappers.ts`) increases the surface for bugs during schema changes.

## 4. Operational & Data Debt
- **Data Integrity**: Inventory changes rely on UI-triggered RPCs; no database-level triggers to enforce consistency if the UI fails.
- **Lifecycle Management**: Permanent deletions (hard deletes) on records like `contatos` and `vendas` make data recovery impossible.

## 5. UI/UX Debt
- **Accessibility**: Low compliance with ARIA standards.
- **Feedback**: Lack of granular loading states in secondary modules.
- **Optimization**: Mobile form usability for complex entry (e.g., procurement) needs audit.

---

## 6. Questions for Specialists

### 🛡️ To: Security / Data Engineer
1. What is the impact of enabling RLS on existing frontend services? Will direct `.select()` calls fail?
2. Can we migrate business logic from `SECURITY DEFINER` views to edge functions or `SECURITY INVOKER` views?
3. Should we implement soft deletes (`deleted_at`) as a global pattern?

### 🎨 To: UX Design Expert
1. Is the "Tactical Dark" theme fully compliant with contrast standards?
2. Are the mobile navigation patterns (`BottomNav`) appropriate for the density of features in the Sales/Financial modules?

### 🧪 To: QA Specialist
1. Which testing framework is best suited for this Capacitor/Vite setup?
2. What are the top 3 critical paths that require immediate E2E coverage?
