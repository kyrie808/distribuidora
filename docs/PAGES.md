# Documentação das Páginas

## Estrutura Global
Todas as páginas em `src/pages/` agora seguem um padrão estrito de layout:
```tsx
<div className="bg-background-light dark:bg-background-dark ... min-h-screen flex justify-center">
    <div className="relative ... max-w-7xl ...">
        <Header sticky ... />
        <PageContainer>
            {/* Conteúdo */}
        </PageContainer>
    </div>
</div>
```
Isso garante que o tema (Light/Tactical Dark) seja aplicado uniformemente e que o conteúdo centralizado nunca exceda `max-w-7xl` em telas grandes.

## Dashboard (`/`)
- **Layout**: Grid híbrido (1 col mobile / 4 col desktop).
- **Funcionalidade**: Visão geral do negócio (Faturamento Pago, Lucro Real, Entregas, Alertas de Recompra).
- **Interação**: Filtro global de Mês (`MonthPicker`) que afeta todos os widgets.

## Contatos (`/contatos`)
- **Layout**: Lista vertical com Header fixo e "Story Filters" no topo.
- **Filtros**:
  1. Todos
  2. Clientes (Status = cliente)
  3. Leads (Status = lead)
  4. VIPs (Status = cliente + Tipo = B2B)
  5. Inativos (Status = inativo)
- **Ações**: Busca textual em tempo real (Nome/Telefone), Adicionar Novo Contato (FAB e Modal).

## Detalhe do Contato (`/contatos/:id`)
- **Header**: Dados principais (Nome, Apelido, Status). Ação de "Editar" abre `ContatoFormModal`.
- **Abas**:
    - _Visão Geral_: Dashboard simplificado do cliente (Vendas, Saldo).
    - _Dados_: Exibição read-only dos dados cadastrais completos.
    - _Pedidos_: Histórico de compras.
- **Edição**: Utiliza o novo modal `4xl` via Portal para edição sem sair da página.

## Vendas (`/vendas`)
- **Layout**: Lista de vendas com filtros rápidos (badges).
- **Funcionalidade**: Listagem, busca por nome/ID, Modal de Recebimento de Pagamento, Modal de Exclusão.
- **Header**: Sticky com título centralizado.

## Nova Venda (`/nova-venda`)
- **Fluxo**: Wizard simplificado para criação rápida de pedidos.
- **Seleção de cliente**: via `Combobox`.
- **Adição de itens**: com cálculo automático.
- **Finalização**: com formas de pagamento múltiplas.
- **Integração**: Busca proativa de produtos e tabela de preços.

## Outras Páginas
- `Produtos.tsx`, `Estoque.tsx`, `Entregas.tsx`: Padronizadas com o novo Header e PageContainer.
