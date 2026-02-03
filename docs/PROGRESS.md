# Progresso do Projeto

## Próximos Passos
- [ ] Implementar autenticação de usuários
- [ ] Criar testes E2E
- [ ] Otimizar queries de dashboard (Server-Side Pagination)

## Entregas Recentes

### 2026-02-03 - Correção de Integridade de Dados & Regime de Caixa
- **Mudança de Lógica Financeira (Critical):**
  - **Faturamento:** Alterado para **Regime de Caixa** (Apenas vendas com `pago=true`).
  - **Lucro:** Alterado para `(Faturamento Pago - Custo Pago)`. Anteriormente era uma estimativa fixa.
  - **Filtros de Data:** Dashboard agora respeita estritamente a **Data da Venda/Entrega** (`data`) ao invés da criação (`criado_em`), resolvendo bugs de "vendas fantasmas" de meses anteriores.
- **Correções de Dashboard:**
  - **Ultimas Vendas:** Widget agora respeita o filtro de mês global (não mostra mais vendas globais recentes se estiver filtrado em Janeiro).
  - **Mourning/Spillover:** Correção de bug de fuso horário que incluía vendas de 01/Fev em Jan.
  - **Métricas Operacionais:** "Entregues" e "Pendentes" ajustados para mostrar dados **do mês** e não globais.
- **UI UX:**
  - Aumento do padding inferior (`pb-32`) para evitar corte de widgets no mobile.
  - Remoção de duplicidade de lógica entre Local e Main.

### 2026-02-03 - Refatoração UI & "Apple Design" (Dashboard)
- **Widgets Premium:**
  - `TopIndicadoresWidget`: Ranking com gradientes Gold/Silver/Bronze e glassmorphism.
  - `UltimasVendasWidget`: Lista minimalista com indicadores de status visuais.
  - `AlertasRecompra` e `AlertasFinanceiro`: Migrados para Carrossel Horizontal (`DashboardCarousel`) para economizar espaço vertical.
- **Frontend Architecture:**
  - Criação do `docs/FRONTEND_GUIDE.md` para padronização.
  - Limpeza de Warnings/Lints em componentes chave.
  - Correção de problemas de importação circular em tipos (`DomainContato`).
  - **Responsividade Híbrida (Fix):**
    - Dashboard agora expande para `max-w-7xl` em Desktop (antes travado em mobile).
    - Grid adaptativo: 1 coluna (Mobile) -> 4 colunas (Desktop).
    - Correção de badges colapsando (`shrink-0`) em `KpiCard`.
  - **Sistema de Tema Híbrido:**
    - Implementação de `ThemeContext` e `ThemeToggle`.
    - Suporte a Light (Padrão) e Dark (Tactical) modes via toggle no header.
    - Correção do bug de `createRoot` e tela branca.
- **Dashboard V2:**
  - Layout totalmente responsivo com seções claras (Alertas, Indicadores, Vendas).
  - Tema "Tactical Dark" consolidado.

### 2026-02-02 - Domain Shielding (Arquitetura & Estabilidade)
- **Refatoração Maior:** Desacoplamento total da UI do Banco de Dados via **Domain Layer**.
- **Novo Padrão Arquitetural:**
    - `src/types/domain.ts`: Definições puras das entidades de negócio (camelCase).
    - `src/services/mappers.ts`: Transformação segura de DTOs (snake_case) para Domain Objects.
    - `src/services/vendaService.ts`: Centralização da lógica de acesso a dados.
- **Refatoração Contatos:**
    - Implementação de `contatoService.ts`.
    - Eliminação de `api/` (Python Backend) e migração de Geocoding para TypeScript.
- [x] **Fase 5: Dashboard (The Cockpit)**
  - [x] Refatorar `Dashboard.tsx` para Grid System
  - [x] Modernizar Widgets (Financeiro, Recompra, Estoque)
  - [x] Implementar "Big Numbers" Cards
  - [x] Mobile-First: 1 Coluna em telas pequenasda.
- **Visual Overhaul (Phase 1):** (Novo)
    - Fundações do Shadcn/UI instaladas (`clsx`, `cva`, `utils.ts`).
    - Configuração do Tailwind `v3` adaptada para variáveis CSS.
    - Tema "MassasCRM" (Alto Contraste) definido em `index.css`.
- **Visual Overhaul (Phase 2):** (Novo)
    - Migração de `Button`, `Input`, `Badge` para Shadcn.
    - Componentes Core refatorados com suporte a `isLoading` e Mobile-First `h-12`.
    - Compatibilidade com código legado mantida.
- **Visual Overhaul (Phase 3):** (Novo)
    - Path Aliases (`@/*`) configurados.
    - Layout Mobile-First implementado (`Header` fixo, `BottomNav` com FAB).
    - `PageContainer` ajustado para evitar sobreposição de conteúdo.
- **Visual Overhaul (Phase 4):** (Novo)
    - `Vendas.tsx`: Cards refatorados com Shadcn, hierarquia visual clara e interatividade touch.
    - `Produtos.tsx`: Visualização de estoque crítico (cores/badges) e custos.
    - `src/components/ui/card.tsx`: Migrado para padrão Shadcn.
    - Padronização de variantes do componente `Badge`.
    - Correção de lógica de pagamento em `Vendas` e `VendaDetalhe`.
    - Zero erros de lint e console.
- **Visual Overhaul (Phase 5):** (Concluído)
    - **Dashboard Completo**:
        - Grid responsivo (1 col mobile, 2 cols tablet, 4 cols desktop).
        - Widgets modulares: `AlertasFinanceiro` (Fiado), `AlertasRecompra` (Churn), `EstoqueWidget` (Críticos).
        - "Big Numbers" Cards com indicadores de tendência.
    - **Qualidade de Código**:
        - Correção extensiva de Lint (imports, types, accessibility).
        - Padronização de casing (`Button` vs `button`).
        - Restauração de componentes core (`Card`, `BottomNav`).
- **Banco de Dados:** Coluna `estoque_minimo` dinâmica por produto
- **Hook Inteligente:** `useEstoqueMetrics` que monitora saúde do inventário
- **Dashboard:** 
    - Widget "Smoke Detector" que avisa proativamente sobre baixo estoque
    - Navegação direta para filtro de problemas
- **Produtos:** 
    - Filtro por URL `?filtro=baixo_estoque`
    - Feedback visual no card (ícone de alerta, quantidade em vermelho)

### 2026-02-02 - Estabilização e Correções Críticas
- **Fix:** Redirecionamento `/clientes` -> `/contatos` implementado (App.tsx).
- **Fix:** Crash em `ContatoDetalhe.tsx` resolvido (erro de data `undefined` e conflito de tipos).
- **Refactor:** `ContatoCard` e `ContatoFormModal` migrados para usar tipos de Domínio (`DomainContato`) consistentemente.
- **Docs:** Atualização completa da documentação (`DATABASE`, `COMPONENTS`, `HOOKS`) refletindo estado atual.

### 2026-02-02 - Reestruturação de Navegação e UX
- **Menu Unificado:** Nova página `/menu` para centralizar funções secundárias
- **BottomNav V2:**
    - Focado em 3 rotas principais + Ação (FAB) + Menu
    - Redução de carga cognitiva (11 itens -> 5 itens)
- **UX:** Auditoria completa e aplicação de "Smoke Detectors" operacionais

### 2026-02-01 - Dashboard Financeiro e Modularização
- **Implementado:** Widget de Alertas Financeiros (Fiado)
    - Alerta de atrasados, vencendo hoje e próximos
    - Integração direta com WhatsApp para cobrança
- **Refatorado:** Dashboard Modular
    - Extração de `AlertasRecompraWidget`
    - Criação de `AlertasFinanceiroWidget`
    - Layout responsivo em grid
- **Documentação:**
    - Atualizado `DATABASE.md` com tabelas de pedidos de compra e pagamentos
    - Atualizados `HOOKS.md` e `COMPONENTS.md`

### 2026-02-01 - Refatoração Fluxo de Vendas (Financeiro)
- **Correção:** Persistência de `parcelas` e `data_prevista_pagamento`
- **Feature:** Geração automática de `pagamentos_venda` para vendas à vista
- **QA:** Protocolo de testes de campo executado com sucesso

### 2025-01-31 - Gestão de Pedidos de Compra (Purchase Orders) v1.0
- **Novas Tabelas:** `purchase_orders`, `purchase_order_items`, `purchase_order_payments`
- **Features:** 
  - CRUD completo de pedidos
  - Recebimento de estoque (atualiza produtos)
  - Registro de pagamentos a fornecedores
  - Status automático (Pending -> Received / Unpaid -> Paid)
- **UI:** Telas de listagem, criação e detalhes de pedidos

### 2025-01-XX - MVP Inicial
- Cadastro de Clientes e Produtos
- Lançamento de Vendas Simples
- Dashboard Básico
