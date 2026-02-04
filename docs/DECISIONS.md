# Registro de Decisões de Arquitetura (ADR)

## 2026-02-02: UI Overhaul & Strict Domain Shielding

### Decisão
Refatorar a interface para utilizar **Shadcn UI** e **Tailwind CSS** com uma abordagem Mobile-First rigorosa, e **blindar a lógica de negócio com uma Camada de Domínio explícita**.

### Motivação
- A UI anterior era inconsistente e difícil de manter.
- O acoplamento direto entre componentes React e tipos do banco de dados (Snake Case) gerava erros de lint, bugs de renderização (ex: datas inválidas) e refatoração difícil.
- Necessidade de uma UX "App-like" para operação em campo via celular.

### Detalhes Técnicos
1. **Shadcn Integration**: Adoção de componentes copy-paste localizados em `src/components/ui`.
2. **Domain Layer**: 
   - Criação de `src/types/domain.ts` (camelCase). 
   - **Regra:** Componentes de UI (`components/`) DEVEM receber apenas props do tipo Domínio. 
   - **Regra:** Hooks (`hooks/`) são responsáveis por converter `DB Type -> Domain Type`.
   - **Regra:** Services (`services/`) são responsáveis pelo mapeamento bidirecional e validação.
3. **Bottom Navigation**: Priorização da navegação inferior para mobile.

---

## 2026-02-03: Adoção de Regime de Caixa (Cash Basis)

### Decisão
O Dashboard financeiro agora reflete estritamente o **Regime de Caixa** e filtros baseados na **Data de Competência (Venda)**.

### Motivação
- Discrepâncias entre "Vendas Criadas" e "Dinheiro em Caixa".
- O usuário precisa ver exatamente quanto *recebeu* e *lucrou* em dinheiro real no mês.
- Vendas criadas em um mês (ex: Dez) mas com data de entrega futura (ex: Jan) estavam distorcendo os relatórios.

### Implementação
- **Faturamento**: `SUM(total)` onde `pago = true`.
- **Lucro**: `SUM(total - custo)` onde `pago = true`.
- **Filtro**: Queries Typescript alteradas para usar `.gte('data', start)` ao invés de `criado_em`.

---

## 2026-02-03: Regime de Caixa para Dashboard Financeiro

### Decisão
Adotar estritamente o **Regime de Caixa** para todas as métricas financeiras (Faturamento, Lucro) no Dashboard.

### Motivação
- Discrepância entre vendas realizadas (competência) e dinheiro em caixa.
- Necessidade de visão real do fluxo de caixa ("O que entrou").
- Vendas antigas marcadas como pagas no mês atual devem refletir no caixa do mês (se aplicável) ou, na decisão atual, filtramos pela `data` da venda mas exigimos `pago=true`. *Nota: A implementação atual filtra por data da venda + pago=true. Para fluxo de caixa puro (data do pagamento), seria necessário um campo `data_pagamento`.*

### Implementação
- Filtro: `pago = true`.
- Data: `data` da venda dentro do range selecionado.
- Lucro: `(Venda.total - Venda.custo)` apenas para vendas pagas.

---

## 2026-02-03: Sistema de Tema Controlado pelo Usuário

### Decisão
Transição de "Forced Dark Mode" para **Sistema Híbrido (Toggle)** com default `light`.

### Motivação
- Preferência do usuário por interface "branca" (clean) no dia a dia.
- Inconsistências ao forçar dark mode via HTML hardcoded.

### Implementação
- `ThemeContext` criado para gerenciar estado e persistência.
- Botão Toggle adicionado ao Header para troca rápida.
- Performance otimizada (memoização e CSS transforms) para evitar delays na troca.

---

## 2026-02-01: Modularização do Dashboard

### Decisão
Quebrar o Dashboard monolítico em Widgets independentes (`src/components/dashboard/*Widget.tsx`).

### Motivação
O arquivo `Dashboard.tsx` estava crescendo demais, misturando lógica de financeiro, estoque e CRM.

### Resultado
- `AlertasFinanceiroWidget`: Focado em receber.
- `AlertasRecompraWidget`: Focado em reter.
- `EstoqueWidget`: Focado em controlar.
Cada widget gerencia seu próprio data fetching (on demand) ou recebe dados via prop drilled de um hook container se houver dependência compartilhada (ex: filtro de data global).

---

## 2025-01-30: Supabase como Backend-as-a-Service

### Decisão
Migrar todo o backend (anteriormente Python/FastAPI) para Supabase.

### Motivação
- Simplificação da stack (Serverless).
- Auth, Database e Realtime em uma única plataforma.
- Tipagem automática com TypeScript via `supabase gen types`.

### Estratégia
- Lógica de negócio complexa movida para **Custom Hooks** no frontend ou **Database Functions** (RPC) quando performance for crítica.
- RLS (Row Level Security) para proteção de dados por tenant/usuário.
