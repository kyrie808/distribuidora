# Frontend & UX Documentation - Gilmar Distribuidor Massas

## Introduction
The frontend is a high-performance React application designed for both desktop (admin/warehouse) and mobile (field sales) use. It prioritizes data visibility and quick action via a modular dashboard and streamlined sales forms.

## Component Architecture

### Structural Hierarchy
- **Layouts**: Managed in `src/components/layout/`. Contains `Header`, `AppLayout`, and specific drawer components.
- **Pages**: Top-level route components in `src/pages/`.
- **Features**: Domain-specific components in `src/components/features/` (e.g., `vendas`, `entregas`).
- **Dashboard**: A collection of data-heavy widgets in `src/components/dashboard/`.
- **UI Core**: Atomic components (Buttons, Inputs, Skeletons) in `src/components/ui/`.

### State Management
1. **Server State**: Managed via `@tanstack/react-query`. All data fetching is encapsulated in custom hooks (`src/hooks/`).
2. **Global Client State**: Managed via `Zustand` (`src/stores/`). Primarily used for the shopping cart and auth state.
3. **Local State**: Standard React `useState`/`useReducer` for UI toggles and simple form fields.

## UX Design Patterns

### 1. Visual Language
- **Theme**: Supports Light/Dark mode via `ThemeToggle`.
- **Typography**: Uses a custom `font-display` (likely Inter or similar) for high readability.
- **Color Palette**: Uses semantic colors for status (e.g., `semantic-red` for alerts, `semantic-green` for success).

### 2. Interaction Design
- **Responsive Navigation**: Sidebar-based navigation on desktop, likely collapsing or using a bottom bar/drawer on mobile.
- **Feedback Loops**: Immediate feedback via the `useToast` system for all mutations.
- **Load States**: Extensive use of Skeletons (`Skeleton.tsx`) to prevent layout shifts during data loading.

### 3. Key Dashboard Widgets
- **KpiCard**: High-level metrics with trend indicators.
- **AlertasFinanceiroWidget**: Exception-based reporting for overdue payments.
- **UltimasVendasWidget**: Real-time activity feed.

## Identified UX Debt
- **Complexity in NovaVenda**: The sales form is highly complex and combines client selection, product listing, and checkout in a single view, which may be overwhelming on smaller screens.
- **Filtering Consistency**: Dashboard filters (MonthPicker) are very intuitive, but list views (Vendas, Contatos) have less advanced filtering capabilities.
- **Data Density**: Some widgets show a lot of information in small cards, which might benefit from a "drill-down" pattern.
