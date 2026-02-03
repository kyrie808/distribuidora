# Protocolo de Análise: Dashboard Specs

> [!NOTE]
> Este documento mapeia **funcionalidades e dados** da versão atual (Legacy) da Dashboard para garantir que nada seja perdido no Redesign Visual.

## 1. Inventário de Leitura (Data Points)

### Hooks Principais
| Hook | Propósito | Filtros |
| :--- | :--- | :--- |
| `useDashboardFilter` | Gerencia estado global de mês/ano | `startDate`, `endDate`, `setMonth` |
| `useVendas` | Dados transacionais de vendas | `{ startDate, endDate }` |
| `useContatos` | Base de clientes | N/A |
| `useRecompra` | Inteligência de churn/recompra | N/A |
| `useIndicacoes` | Sistema de Gamification | N/A |
| `useAlertasFinanceiros` | Contas a receber/fiado | N/A (Consumido internamente no widget) |

### Métricas Calculadas (KPIs & Variáveis)

#### 💰 Seção Financeira (KPIs)
- **Faturamento**: `metrics.faturamentoMes` (Total vendido no período filtrado).
- **Lucro Estimado**: `metrics.lucroMes` (Margem aproximada, *atualmente com cast `as any`*).
- **A Receber**: `metrics.aReceber` (Total pendente de pagamento).
- **Ticket Médio**: `metrics.ticketMedio` (Média de valor por venda).

#### 🚨 Seção "Cockpit" (Alertas)
- **Financeiro (Fiado)**:
  - `totalAtrasado`: Soma de valores vencidos.
  - `totalHoje`: Soma de valores vincendo hoje.
  - `alertas`: Lista de débitos (Prioridade: Atrasados > Hoje > Próximos).
- **Recompra Strategy**:
  - `atrasados` (number): Quantidade de clientes que não compram há mais tempo que a média.
  - `contatos` (Array): Lista filtrada por status, ordenando os mais críticos. Variável: `diasSemCompra`.
- **Estoque**:
  - `produtosBaixoEstoque`: Quantidade de produtos com `estoqueAtual <= estoqueMinimo`. Status: "Atenção" (Vermelho) ou "Saudável" (Verde).

#### 📦 Seção Operacional
- **Entregas Pendentes**: `metrics.entregasPendentes`.
- **Entregas Realizadas**: `metrics.entregasRealizadas`.
- **Vendas no Mês**: `metrics.vendasMes` (Contagem simples).

#### 🏆 Seção Gamification (Indicações)
- **Ranking**: `topIndicadores` (Top 3 indicadores com mais conversões).
- **Dados**: `indicador.nome`, `indicacoesConvertidas`, `recompensaAcumulada`.

---

## 2. Inventário de Ações (User Intent)

### Ações de Navegação (Links)
- **Filtro Temporal**: `MonthPicker` (Sticky no topo mobile) -> Altera todo o contexto de dados.
- **Refresh**: Botão manual para recarregar todas as queries.
- **Drill-down Financeiro**: Clicar no card "A Receber" leva para `/vendas?pagamento=nao_pago`.
- **Drill-down Operacional**:
  - "Entregas Pendentes" -> `/vendas?status=pendente`.
  - "Entregas Realizadas" -> `/vendas?status=entregue`.
  - "Relatório Fábrica" -> `/relatorio-fabrica` (Feature específica de separação de carga).
- **Ver Detalhes**:
  - Clicar em uma Venda -> `/vendas/:id`.
  - Clicar em um Cliente (Recompra/Indicação) -> `/contatos/:id`.

### Ações de Interação (Funcionalidades)
- **WhatsApp Direto (Cobrança)**:
  - **Onde**: No widget `AlertasFinanceiroWidget`.
  - **Lógica**: Abre URL do WhatsApp com mensagem pré-formatada.
  - **Condicional de Mensagem**:
    - *Atrasado*: "Vi que venceu dia X..."
    - *Hoje*: "Lembrete que vence hoje..."
    - *Futuro*: "Lembrete para dia X..."

### Logica Condicional Visual
- **Cor dos Cards de Alerta**:
  - Vermelho (`destructive`): Se `status === 'atrasado'` ou Estoque Crítico.
  - Amarelo (`warning`): Se `status === 'hoje'`.
  - Padrão/Verde: Se situação normal.
- **Estados Vazios (Empty States)**:
  - Exibe cards tracejados/cinzas se não houver alertas, vendas recentes ou indicações.

---

## 3. Estrutura de Widgets (Layout)

1.  **Header Global**: Título + Ação de Refresh.
2.  **Filtro Global**: MonthPicker (Sticky).
3.  **Grid KPI (Top 4)**: Cards simples com ícone + valor grande.
4.  **Grid Cockpit Critico (Main)**:
    - Coluna Esquerda/Centro (2/3 da largura em desktop):
        - Grid Interno: Financeiro + Recompra.
        - Abaixo: Estoque.
    - Coluna Direita (Operacional):
        - Lista compacta de Entregas + Link para Relatório de Fábrica.
5.  **Listagens Secundárias (Footer)**:
    - Últimas Vendas (Lista detalhada).
    - Campeões de Indicação (Lista rankeada 1-3).

---

## 4. Prompt Generator (Resumo para Designer)

> **Contexto para IA de Design:**
> "Você está projetando a Dashboard Principal de um ERP moderno para distribuidoras de alimentos (Mobile First). O objetivo é ser um 'Cockpit de Comando' para o dono do negócio.
>
> **Prioridades Visuais:**
> 1.  **Saúde Financeira Imediata**: As métricas de Faturamento, Lucro e, principalmente, "Contas a Receber" devem ter destaque absoluto.
> 2.  **Alertas de Ação (Action-Driven)**: Diferencie claramente o que é apenas informativo do que exige ação imediata (cobrar um cliente fiado no WhatsApp, ligar para um cliente inativo ou repor estoque). Use cores semafóricas (Vermelho/Amarelo/Verde) de forma inteligente para guiar o olho.
> 3.  **Operação Diária**: O usuário precisa saber rapidamente quantas entregas faltam sair hoje.
>
> **Estilo**: Use um visual 'Glassmorphism' limpo, tipografia Inter nítida e espaçamento generoso. O design deve parecer premium e confiável. A dashboard deve incluir um seletor de mês fixo no topo. As listas de 'Últimas Vendas' e 'Ranking' são secundárias e devem ficar abaixo da dobra principal."
