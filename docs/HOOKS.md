# Custom Hooks

A aplicação utiliza hooks para gerenciar estado e comunicação com a API (Supabase).

## Hooks de Nível de Domínio

### `useContatos` e `useContato`
Gerenciamento de clientes e fornecedores.
- **Path:** `src/hooks/useContatos.ts`
- **Exports:**
    - `useContatos(options)`: Lista contatos com filtros.
    - `useContato(id)`: Busca detalhada de um contato único (inclui indicador).
- **Features:** CRUD completo, busca por string, geocoding automático.

### `useVendas` e `useVenda`
Gerenciamento de transações.
- **Path:** `src/hooks/useVendas.ts`
- **Exports:**
    - `useVendas()`: Listagem e KPIs.
    - `useVenda(id)`: Detalhes de uma venda.
- **Features:** CRUD, cálculo de KPIs financeiros, registro de pagamentos.

### `useProdutos`
Catálogo de produtos.
- **Path:** `src/hooks/useProdutos.ts`
- **Features:** Controle de estoque, lista de preços.

### `usePurchaseOrders`
Módulo de compras.
- **Path:** `src/hooks/usePurchaseOrders.ts`
- **Features:** Gestão de pedidos para fornecedores.

### `useIndicacoes`
Sistema de referral.
- **Path:** `src/hooks/useIndicacoes.ts`
- **Features:** Cálculo de conversão e árvores de indicação.

### `useEstoqueMetrics`
Monitoramento de inventário.
- **Path:** `src/hooks/useEstoqueMetrics.ts`
- **Features:** Detecção de baixo estoque.

### `useAlertasFinanceiros`
Cobranças e fiado.
- **Path:** `src/hooks/useAlertasFinanceiros.ts`
- **Features:** Filtro de clientes com débitos vencidos/a vencer.

### `useRecompra`
Monitoramento de ciclo de vida do cliente.
- **Path:** `src/hooks/useRecompra.ts`
- **Features:** Identifica clientes inativos baseados na última compra.

### `useTopIndicadores`
Ranking de performance de indicações.
- **Path:** `src/hooks/useTopIndicadores.ts`
- **Features:** Calcula stats de quantos clientes ativos cada indicador trouxe.


## Hooks Utilitários

### `useCep`
Busca de endereço via API ViaCEP.
- **Path:** `src/hooks/useCep.ts`

### `useToast` e `useToastStore`
Sistema de notificações global.
- **Path:** `src/components/ui/Toast.tsx`

### `useDashboardFilter`
Store global (Zustand) para filtros de período no dashboard.
- **Path:** `src/hooks/useDashboardFilter.ts`
