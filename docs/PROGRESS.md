# Progresso do Projeto

## Próximos Passos
- [ ] Implementar autenticação de usuários
- [ ] Criar testes E2E
- [ ] Otimizar queries de dashboard (Server-Side Pagination)

## Entregas Recentes

### 2026-02-18 - Correção de Erro 400 no Cadastro de Pedidos de Compra
- **Bug Fix:** Resolvido o erro 400 ao salvar pedidos de compra.
  - A causa era a tentativa de inserir valores na coluna `total_cost` da tabela `purchase_order_items`.
  - Esta coluna é do tipo `GENERATED ALWAYS`, sendo calculada automaticamente pelo banco de dados.
  - O hook `usePurchaseOrders` foi atualizado para remover o campo `total_cost` dos payloads de `INSERT` e `UPDATE`.
- **Validação:** Verificado via build de produção e análise de esquema do banco de dados.

### 2026-02-09 - Redesign de UX & Acessibilidade nos Pedidos
- **Refatoração Visual (Design System):**
  - **Status Chips:** Substituição do sistema "semáforo" (ícones soltos) por **Chips Explícitos** (Ícone + Texto).
  - **Acessibilidade:** Cores de alto contraste (Verde Neon/Amber) e remoção de indicadores cinza (inativos).
  - **VendaDetalhe:** Remoção de ícones do header para limpeza visual.
- [x] Detalhes de Venda Premium (Quitar parcelas, status visual)
- [x] Milestone: Ranking Mont (Refatoração completa, views no Supabase, dois rankings)
- [x] Fix: TypeScript Build Errors for Vercel Deployment
- **Novas Ações de Venda:**
  - Botões de ação direta no rodapé: **"Entregar"** (Toggle) e **"Quitar"**.
  - Melhor hierarquia visual e facilidade de toque para usuários idosos.
- **Toast Notifications V2:**
  - Redesign completo para estilo "Pill" (Compacto e Arredondado).
  - Posicionamento **Top-Center** para evitar conflito com botões de rodapé.
  - Fundo sólido e sombras para legibilidade em qualquer fundo.


### 2026-02-09 - Funcionalidade de Apelido (Nickname)
- **Database:** Adição da coluna `apelido` na tabela `contatos`.
- **UI/UX:**
  - Campo "Apelido" adicionado ao formulário de criação/edição.
  - Exibição no cabeçalho do perfil: `Nome ● (Apelido)`.
  - Exibição no Card de Listagem: Nome seguido do apelido.
- **Backend:** Atualização de tipos e schemas Zod para suportar o novo campo opcional.

### 2026-02-07 - Migração de PaymentModal para PaymentSidebar
- **Consistência UX Aprimorada:**
  - Substituído modal centralizado por sidebar integrado, seguindo o padrão do `CheckoutSidebar`.
  - Layout desktop: sidebar fixa de 96 (w-96) na lateral direita.
  - Layout mobile: drawer deslizante de baixo para cima com backdrop.
- **Melhorias na Experiência:**
  - Formulário de pagamento com datetime-local corrigido para exibir picker nativo.
  - Histórico de pagamentos visível durante o registro de novo pagamento.
  - Botão "voltar" para fechar o sidebar sem sair da página de vendas.

### 2026-02-07 - Sistema Avançado de Filtros de Vendas
- **Filtros de Duas Categorias (Dual-Row):**
  - Linha de **Entrega** (ícone Truck): Todas, Entregues, Pendentes, Canceladas.
  - Linha de **Pagamento** (ícone Dollar): Ver todas, Quitados, Parciais, Pendentes.
  - Contadores em tempo real para cada categoria, exibidos nas badges.
- **UX & Persistência:**
  - Filtros sincronizados com a URL via `useSearchParams`.
  - Scroll horizontal suave em mobile para navegação completa.
  - Cores semânticas (success, warning, danger) para feedback visual imediato.

### 2026-02-07 - Refatoração do Módulo "Nova Venda" (UX Flow)
- **Fluxo de Checkout Integrado (Sidebar Style):**
  - Eliminação do `CheckoutModal` centralizado em favor do `CheckoutSidebar`.
  - Transição fluida entre Carrinho e Checkout dentro do mesmo painel lateral (Desktop e Mobile).
  - Suporte total a métodos de pagamento (Pix, Dinheiro com troco, Cartão com parcelas, Fiado com vencimento).
  - **Melhorias de UX & Layout:**
    - Resolução de conflitos de z-index com o `BottomNav`.
    - Implementação de multi-view na sidebar (Cart <-> Checkout).
    - Botões de ação otimizados para evitar cortes em telas menores.

### 2026-02-04 - Padronização de Layout & Contatos V2
- **Standardização Global de Layout ("Tactical Dark"):**
  - Implementação de um wrapper de layout unificado em **todas** as páginas (`src/pages/*`).
  - Container centralizado (`max-w-7xl`) com sombra suave e background consistente (`bg-background-light`/`dark`).
  - **Header V2:**
    - Refatoração para `sticky` positioning (respeitando o container central).
    - Design "Glassmorphism" padronizado (`backdrop-blur-md`).
    - Remoção de CSS overrides manuais em páginas individuais.
  - **PageContainer V2:** Background transparente e padding ajustado (`pt-0 pb-32`) para fluxo contínuo.
- **Página de Contatos V2:**
  - **Story Filters:** Novo componente de filtragem estilo "Instagram Stories" (Todos, Clientes, Leads, VIPs, Inativos).
  - **UX Refinada:** Filtros reordenados por prioridade (Clientes > Leads).
  - Design imersivo com elementos de fundo (blobs de luz).
  - Card de Contato unificado com design "Apple-like".

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
- [x] **Refatoração Modal Contato (UX & Mobile)**: Redesign completo do modal de edição de contato.
  - Layout "Wide" (4XL) com duas colunas para desktop.
  - Estilo "Tactical Dark" com inputs translúcidos e ícones.
  - Correção de Z-Index mobile usando React Portal.
  - Scrollbar invisível para estética limpa.
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
