# Frontend Specification: Distribuidora

## 1. Design System
- **Typography**: 
  - Display: `Lexend`
  - Body: `Noto Sans`
- **Color Palette**: 
  - **Light (Stitch)**: Primary Neo Green (#13ec13), Background White, Semantic Yellow/Red.
  - **Dark (Tactical)**: Background #0a0f0d, Card #1a2620, Primary Neo Green.
- **Design Tokens**: Managed via Tailwind CSS variables in `src/index.css`.

## 2. Component Architecture
### 2.1 UI Primitives (`src/components/ui`)
- Reusable, atomic components: `Button`, `Input`, `Card`, `Badge`, `Modal`, `Select`, `Skeleton`, `Toast`.
- Includes a `ThemeToggle` for switching between Light and Tactical Dark.
- Floating Dock component for secondary interactions.

### 2.2 Layout (`src/components/layout`)
- **AppLayout**: Root wrapper with navigation.
- **BottomNav**: Mobile-optimized navigation bar with main actions.
- **Header**: Sticky top bar with user greeting, theme toggle, and refresh/notifications.

### 2.3 Dashboard Features (`src/components/dashboard`)
- **KpiCard**: Main metric display with trends and icons.
- **Widgets**: specialized cards for alerts (Financial, Repurchase), rankings (Indications), and recent activity (Recent Sales).

## 3. Key User Flows
- **Dashboard**: High-level overview of revenue, profit, and alerts.
- **Sales Flow**: `/nova-venda` for creating orders, integrated with product catalog and contact selection.
- **Inventory Management**: `/estoque` for monitoring stock levels and receiving purchases.
- **Financial Control**: `/fluxo-caixa` and `/plano-de-contas` for auditing transactions and categories.

## 4. UI/UX Debt
- [ ] **Accessibility (a11y)**: Low usage of ARIA labels in custom components; focus management in Modals needs verification.
- [ ] **Loading States**: Skeletons are implemented for main dashboard components, but some sub-pages lack granular loading feedback.
- [ ] **Visual Consistency**: Multiple color palettes (e.g., standard red vs `semantic-red`) exist in the config.
- [ ] **Mobile Optimization**: Some complex forms might feel cramped on small resolutions (needs audit).
