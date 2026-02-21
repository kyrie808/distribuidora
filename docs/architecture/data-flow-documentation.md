# Data Flow & State Management Documentation - Gilmar Distribuidor Massas

## Data Architecture Overview
The application follows a primarily **server-state oriented** architecture, leveraging Supabase for data persistence and React Query for management of that state in the frontend.

## Data Flow Lifecycle

### 1. Database Layer (Supabase)
- **Tables**: Source of truth for all domain entities.
- **Views**: Aggregation layer for complex reporting (e.g., `view_home_financeiro`).
- **Functions/RPCs**: Encapsulated business logic (e.g., `rpc_marcar_venda_paga`).

### 2. Service & Mapper Layer
Located in `src/services/`, this layer acts as the bridge:
- **Services**: Functional wrappers around Supabase queries. Inconsistent application—some modules use services, others query directly in hooks.
- **Mappers** (`mappers.ts`): Transforms snake_case database records into camelCase TypeScript domain models.

### 3. Hook Layer (React Query)
The primary interface for components:
- Modules with services: `useVendas` -> `vendaService` -> Supabase.
- Dashboard: `useDashboardMetrics` -> Direct Supabase View Query.
- **Cache Policy**: Stale times are generally set to 5 minutes for reporting data.

### 4. Component Layer
Dashboard widgets and list pages consume data from hooks, handling loading states via Skeletons.

## State Management Patterns

### Server State (React Query)
- Used for: Sales, Products, Customers, Financial Metrics.
- Benefits: Automatic caching, background refetching, and easy loading/error state handling.

### Global Client State (Zustand)
- **`useCartStore`**: Manages the current sale being created. Persists across navigation in a single session.
- **`useAuthStore`**: (Likely) manages the current user session.

### Domain Logic Distribution
| Logic Type | Location | Recommended Improvement |
|------------|----------|-------------------------|
| KPI Calculation | DB Views + Frontend | Move all complex math to DB Views or Edge Functions |
| Inventory Updates | DB Triggers | Maintain as-is, ensure robust testing |
| Sales Validation | Client-side (Zod) + DB | Centralize in a single service layer |

## Critical Data Flows
1. **New Sale**: `NovaVenda Form` -> `useCartStore` -> `useVendas (Mutation)` -> `vendaService` -> `supabase (vendas + itens_venda + triggers)`.
2. **Dashboard Load**: `useDashboardMetrics` -> Parallel queries to 3 SQL Views -> UI Skeleton -> Widget Rendering.
3. **Payment Processing**: `VendaDetalhe` -> `rpc_marcar_venda_paga` -> `lancamentos` table update.
