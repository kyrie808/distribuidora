# Registro de Decisões de Arquitetura (ADR)

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
