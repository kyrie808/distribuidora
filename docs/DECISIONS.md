# Registro de Decisões de Arquitetura (ADR)

## 2026-02-09: UX Acessível e Design System
**Contexto:** Usuários idosos relataram dificuldade em identificar status apenas por ícones ("Semáforo"). Modais e Toasts escondiam botões importantes.
**Decisão:**
1. **Chips Explícitos:** Substituição de ícones soltos por Chips (Ícone + Texto). Uso exclusivo de cores ativas (Neon/Amber) para status pendentes.
2. **Toast Redesign:** Movemos para Top-Center (Pill Shape) para liberar a área inferior (FAB).
3. **Ações Footer:** Botões grandes e explícitos no rodapé da VendaDetalhe.

## 2026-02-04: Padronização de Layout Global e Header Sticky
**Contexto:** O sistema possuía inconsistências visuais entre páginas (Headers fixos vs scrolls vazando, larguras diferentes em Desktop). O tema "Tactical Dark" exige consistência absoluta.
**Decisão:**
1. **Wrapper Global:** Todas as páginas devem ser envolvidas por um container base flexível que centraliza o conteúdo em `max-w-7xl` e aplica o background do tema.
2. **Sticky Header:** Abandonamos `position: fixed` (full width) para o componente `Header` em favor de `position: sticky`. Isso permite que o Header respeite a largura do container pai (`max-w-7xl`) e previna que ele "vaze" para fora do layout centralizado em monitores ultrawide, mantendo o efeito de glassmorphism sobre o conteúdo correto.
3. **Story Filters:** Adotamos o padrão de "Instagram Stories" para filtros rápidos em listas principais (Contatos), substituindo badges estáticas onde a filtragem por categoria é a ação primária.

## 2026-02-06: Modal via React Portal
- **Contexto**: Modais estavam sendo renderizados dentro da árvore DOM normal, causando problemas de Z-Index e empilhamento com Headers/Navbars fixos em mobile.
- **Decisão**: Migrar `Modal.tsx` para usar `createPortal(..., document.body)`.
- **Consequências**:
  - (+) Modal sempre fica no topo da hierarquia visual, independente de onde é chamado.
  - (+) Resolve conflitos com `overflow: hidden` de containers pais.
  - (-) Requer cuidado extra com eventos que dependem de propagação na árvore do React (o que o Portal preserva, mas vale notar).

## 2026-02-03: Refatoração do Dashboard e Grid Híbrido
**Contexto:** O Dashboard precisava acomodar mais Widgets sem perder usabilidade no Mobile.
**Decisão:** Implementação de um Grid CSS responsivo Híbrido.
- **Mobile:** Stack vertical (1 coluna).
- **Desktop:** Grid de 4 colunas. Widgets menores ocupam 1 col, Carrosséis e Gráficos ocupam 2 cols. Isso maximiza a densidade de informação em telas grandes sem prejudicar a clareza.

## 2026-02-03: Regime de Caixa para Dashboard Financeiro
**Contexto:** Discrepância entre "Vendas Realizadas" e "Dinheiro em Caixa".
**Decisão:** Os KPIs financeiros principais (Faturamento, Lucro) agora operam estritamente em **Regime de Caixa** (`venda.pago === true`). Métricas operacionais (total de vendas, itens) continuam em Regime de Competência. Widgets devem deixar essa distinção explícita.

## 2026-01-30: TypeScript Strict Mode & Zod
**Contexto:** Erros de runtime por falta de verificação de tipos em respostas do Supabase.
**Decisão:** Todo dado externo deve passar por validação Zod (`src/schemas/`) antes de ser usado na UI. Tipos TypeScript devem ser inferidos desses schemas (Zod.infer) para garantir Single Source of Truth.

## 2026-01-20: Supabase como Backend-as-a-Service
**Contexto:** Necessidade de backend rápido sem infraestrutura complexa.
**Decisão:** Uso exclusivo do Supabase (Postgres + Auth + Edge Functions).
- Lógica de Negócio complexa -> Edge Functions ou Database Functions (RPC).
- Lógica de UI/Filtro -> Hooks React (`useVendas`, `useContatos`).

## 2026-02-20: Migração de Fornecedor para Tabela de Contatos
- **Contexto**: Pedidos de compra utilizavam um campo de texto livre (`supplier_id`) para identificar fornecedores, o que impedia relatórios precisos e centralização de dados.
- **Decisão**: Migrar `supplier_id` para `fornecedor_id` como Chave Estrangeira (FK) referenciando `contatos`.
- **Consequências**:
  - (+) Integridade referencial garantida pelo banco de dados.
  - (+) Possibilidade de usar o mesmo sistema de contatos para clientes e fornecedores.
  - (+) UI aprimorada com busca real de fornecedores e exibição de nomes amigáveis.
  - (!) Requer atenção às check constraints de `tipo` e `status` na tabela `contatos`.
