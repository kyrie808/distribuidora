# Frontend & UX Specification

## 🎨 Design System e UI
1. **Framework e Estilos**: Tailwind CSS com Shadcn UI. Variáveis baseadas em HSL (Tactical Dark theme em `index.css`).
2. **Mobile-First & Responsividade**: 
   - `min-h-[100dvh]` validado no `AppLayout.tsx`, prevenindo que a barra de endereços corte a visualização em iOS Safari e Chrome Android.
   - Padrão de layout consolidado: Header fixo (glassmorphism), conteúdo centralizado (max-w-7xl) e BottomNav (oculta/exibida via padding).
3. **UX Components**:
   - `ToastContainer` e `PwaUpdateToast` globais.
   - Padrões de "BottomSheet" (CheckoutSidebar) fluídos.
   - Loading states (Skeletons) e proteção de flash de conteúdo sendo introduzidos (DT-008 pendente de completude global).

## ⚠️ Débitos de Frontend / UX

1. **Refatoração Grid 1920px (DT-004)** (Severidade: Média)
   - Apesar dos grids já responderem melhor, há queixa recente (Sprint 3 UX Debts) sobre inconsistências visuais em telas ultrawide (1920px). Necessária correção via design-system de grid bento unificado.
2. **Flashes de UI e Skeletons (DT-008)** (Severidade: Média)
   - A requisição inicial do Supabase em Dashboard ainda pode gerar um breve "flash" antes dos modais e Skeleton cards terminarem de renderizar para os "Big Numbers".
3. **Domain Shielding V2** (Severidade: Alta)
   - A refatoração das UI para utilizar "Tipos de Domínio" puros ao em vez de `Database['public']['Tables']...` foi iniciada estruturalmente, mas a UI profunda ainda acopla os objetos DTO em suas props. Fazer parsing via mapper.
