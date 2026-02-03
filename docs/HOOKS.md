# Hooks (`src/hooks/`)

Hooks customizados para encapsular lógica de negócios e acesso a dados.

| Hook | Função | Retorno Principal |
|------|--------|-------------------|
| `useProdutos` | Gerencia lista de produtos, mix de estoque e CRUD. | `produtos`, `loading`, `error`, `createProduto`, `updateProduto`, `updateEstoque` |
| `useVendas` | Gerencia vendas, filtros por data e status. | `vendas`, `stats`, `loading`, `createVenda`, `updateVendaStatus` |
| `useContatos` | Gerencia clientes e fornecedores. | `contatos`, `loading`, `createContato`, `updateContato` |
| `usePurchaseOrders` | Gerencia pedidos de compra (abastecimento). | `orders`, `loading`, `createOrder`, `receiveOrder` |
| `useEstoqueMetrics` | Análise de saúde do estoque (ruptura, baixo estoque). | `produtosBaixoEstoque`, `produtosZerados`, `custoTotalEstoque` |
| `useAlertasFinanceiros` | Monitora contas a receber (fiado). | `vendasAtrasadas`, `vendasHoje`, `totalAreceber` |
| `useRecompra` | Monitora churn de clientes (tempo sem comprar). | `contatos`, `atrasados`, `emDia`, `loading` |
| `useDashboardFilter` | Store (Zustand) para filtro global de data. | `month`, `year`, `setMonth`, `setYear` |
| `useConfiguracoes` | Gerencia configurações globais do sistema. | `config`, `updateConfig` |
| `useRelatorioFabrica` | Gera dados para produção baseada em vendas. | `itensAgrupados`, `totalGeral` |
| `useIndicacoes` | Gerencia sistema de indicação de clientes. | `indicacoes`, `ranking` |
| `useCep` | Busca endereço via Viacep. | `buscarCep`, `loading` |
| `useScrollPersistence` | Mantém posição do scroll ao navegar. | - |

## Padrões de Implementação

### Data Fetching
A maioria dos hooks de dados (`useProdutos`, `useVendas`, etc.) segue o padrão:
1. Carregamento inicial via `useEffect`.
2. Estado local `data`, `loading`, `error`.
3. Funções de mutação (`create`, `update`) que atualizam o estado local (Optimistic UI) e persistem no Supabase.

### Dashboard Filter
`useDashboardFilter` utiliza **Zustand** para gerenciamento de estado global, permitindo que o filtro de mês no Header afete todos os widgets do Dashboard sem prop drilling excessivo.
