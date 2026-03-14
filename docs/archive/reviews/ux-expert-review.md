# Specialist Review: UX Design Expert 🎨

## 1. Theming & Contrast
- **Tactical Dark Audit**: The background `#0a0f0d` with `#13ec13` (Neo Green) provides high contrast (AAA level) for essential indicators. However, secondary text in gray levels needs verification for AA compliance at small sizes.
- **Design Consistency**: The project uses both `semantic-red` and standard red. These should be unified under a single theme token system.

## 2. Mobile User Experience
- **Navigation**: The `BottomNav` is effective for single-thumb operations. However, the `Nova Venda` (New Sale) flow involves multiple steps that might benefit from a wizard-like interface to reduce cognitive load on small screens.
- **Data Density**: Many tables and KPI cards are visible at once. Recommend adding "Show/Hide" toggles or retractable sections for advanced metrics on mobile.

## 3. Accessibility (a11y)
- **Findings**: Screen reader support is minimal. Custom elements like `FloatingDock` and `StoryFilter` lack keyboard navigation hooks (TabIndex).
- **Recommendation**: Implement `aria-label` and `role` attributes across all `src/components/ui/` primitives.

## 4. Loading & Feedback
- **Recommendation**: Extend skeletons to include the "Recent Sales" and "Indications" widgets. Currently, user feedback during network latency is inconsistent outside the main KPI cards.
