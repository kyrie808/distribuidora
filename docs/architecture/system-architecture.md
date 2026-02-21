# System Architecture & Tech Stack

## Análise do Sistema

### Stack Tecnológico
- **Frontend Framework**: React 19.2 com TypeScript 5.9
- **Build Tool**: Vite 7.2 com suporte a PWA (vite-plugin-pwa)
- **Styling**: Tailwind CSS 3.4 com Shadcn UI (clsx, tailwind-merge)
- **State Management**: Zustand (App state) e React Query v5 (Server state)
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form + Zod
- **Backend/BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **Mobile/Capacitor**: Capacitor v8 (Android/iOS integration)

### Estrutura de Pastas e Componentes
- `src/components/`: Modularizado em layout, ui (shadcn), e domínios específicos.
- `src/hooks/`: Alto grau de abstração (ex: `useVendas`, `useCartStore`, `useAuth`).
- `src/pages/`: Páginas mapeadas 1:1 com rotas (`Dashboard.tsx`, `NovaVenda.tsx`, `CatalogoPendentes.tsx`).
- `src/services/`: Camada de serviço isolando lógica de negócios e RPCs.
- `src/stores/`: Gerenciamento de estado global com persistência (Zustand).
- `src/types/`: Tipagem TypeScript robusta, com transição para Domain Shielding em andamento.

### Padrões de Código
- **Type Safety**: TypeScript Strict Mode. Zero erros de compilação em `tsc --noEmit`.
- **Domain Shielding**: Arquitetura evoluindo para isolar a UI dos tipos gerados pelo DB (Mappers & Domain Models).
- **Componentização**: "Mobile-First" e uso extensivo do contexto `ThemeContext` para dark mode nativo (Tactical Dark).
- **Data Fetching**: Hook pattern integrado com Supabase e React Query para cache e invalidação inteligente.

### Pontos de Integração e Configurações
- **Supabase**: Integração direta viabilizando Realtime DB, Auth e Edge Functions.
- **PWA**: PWA ativado com `registerType: 'prompt'` via Vite.
- **Capacitor**: Integração nativa Android presente (pasta `android/`).
- **Deploy**: Vercel configurado (`vercel.json`).

## ⚠️ Débitos Identificados (Nível Sistema)

1. **Falta de Testes Automatizados** (Severidade: Alta)
   - O projeto possui 0% de cobertura de testes automatizados (Jest/Vitest/Cypress ausentes no package.json).

2. **Acoplamento Remanescente de Banco de Dados** (Severidade: Média)
   - Apesar da Fase 3 de refatoração para "Domain Shielding" estar em andamento (conforme ARCHITECTURE_AUDIT.md), ainda existem pontos da UI acoplados aos tipos do banco.

3. **Duplicação de Lógica vs Estado Global** (Severidade: Baixa)
   - É necessário avaliar se os Mappers podem ser centralizados para evitar duplicação no parsing de entidades como Contatos e Vendas.

4. **Gerenciamento de Erros Client-Side** (Severidade: Média)
   - Embora existam "Toast Notifications", pode faltar um ErrorBoundary global robusto para capturar exceptions do React sem quebrar a tela branca.

## Conclusão da Fase 1
O sistema é moderno e utiliza as versões mais recentes das principais bibliotecas (React 19, Vite 7, Capacitor 8). A saúde do código (zero chamadas falhas do TS) e a adoção de Zustand indicam refinamento recente ("Saneado"). O débito principal é exclusividade à falta de testes E2E/Unitários para segurar as regras de negócio refatoradas.
