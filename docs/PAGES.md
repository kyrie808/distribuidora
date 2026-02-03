# Páginas e Rotas (`src/pages/`)

A aplicação utiliza `react-router-dom` para navegação.

## Estrutura de Rotas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Dashboard` | Visão geral do negócio (KPIs, Gráficos, Alertas). Widgets modulares para Financeiro, Estoque e Recompra. |
| `/nova-venda` | `NovaVenda` | PDV móvel para lançamento rápido de vendas. Fluxo otimizado para lançar e voltar. |
| `/vendas` | `Vendas` | Histórico de vendas. Permite ver detalhes, filtrar por data e registrar pagamentos. |
| `/clientes` | `Contatos` | Gestão de clientes (CRM). Listagem, criação e histórico de compras individual. |
| `/produtos` | `Produtos` | Catálogo de produtos. Gestão de preços, custos e estoque. |
| `/menu` | `Menu` | Hub de navegação para funcionalidades secundárias acessível via BottomNav. |
| `/pedidos-compra`| `PedidosCompra` | Gestão de compras com fornecedores (Purchase Orders). |
| `/recompra` | `Recompra` | CRM ativo: Lista de clientes inativos (churn) para contato. |
| `/entregas` | `Entregas` | Gestão logística simples. |
| `/configuracoes` | `Configuracoes` | Parâmetros do sistema (taxas, metas, etc). |
| `/relatorio-fabrica`| `RelatorioFabrica`| Relatório específico para produção baseada em demanda. |
| `/indicacoes` | `Indicacoes` | Programa de indicação de clientes (Referral). |

## Detalhes de Implementação

### Dashboard
O Dashboard foi refatorado para ser **modular e responsivo**. Ele atua como um container para widgets autônomos:
- `AlertasFinanceiroWidget`: Monitora pagamentos pendentes ("Fiado").
- `AlertasRecompraWidget`: Monitora ciclo de vida do cliente.
- `EstoqueWidget`: Monitora níveis de estoque.

### Nova Venda (PDV)
Focado em velocidade. Layout otimizado para mobile com input facilitado e feedback rápido.

### Layout
Todas as rotas autenticadas são envolvidas pelo `AppLayout` (`src/components/layout/AppLayout.tsx`), que fornece:
- **Header**: Fixo no topo.
- **BottomNav**: Fixa no rodapé (apenas mobile/tablet).
- **Sidebar**: (Planejado para Desktop, atualmente adaptativo).
- **ToastContainer**: Para notificações globais.
