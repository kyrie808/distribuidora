# Componentes

## UI Base (`components/ui/`)

Biblioteca de componentes baseada em [Shadcn UI](https://ui.shadcn.com/), utilizando Tailwind CSS e Radix UI primitives.

| Componente | Props Principais | Descrição |
|------------|------------------|-----------|
| `Button` | `variant`, `size`, `isLoading` | Botão interativo com suporte a estados de loading e variantes (default, destructive, outline, ghost). |
| `Card` | `hover`, `padding`, `onClick` | Container padrão com borda, sombra e suporte a hover effect. Composto por `CardHeader`, `CardContent`, `CardFooter`. |
| `Input` | `label`, `error`, `helperText` | Campo de entrada de texto com label e mensagem de erro integrados. |
| `Select` | `label`, `error`, `options` | Componente de seleção nativo estilizado. |
| `Badge` | `variant` | Etiquetas de status (default, secondary, destructive, outline, success, warning, gray). |
| `Modal` | `isOpen`, `onClose`, `title` | Diálogo modal responsivo com overlay e animação. |
| `Toast` | `type`, `message` | Notificações flutuantes (via hook `useToast`). |
| `Spinner` | `size` | Indicador de carregamento circular. |
| `EmptyState` | `title`, `description`, `icon` | Placeholder visual para listas vazias. |
| `LoadingScreen`| `message` | Tela cheia de carregamento centralizado. |

### Exemplo de Uso (Card)
```tsx
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui'

<Card hover onClick={handleClick}>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Conteúdo aqui...</p>
  </CardContent>
</Card>
```

---

## Layout (`components/layout/`)

Componentes estruturais da aplicação.

| Componente | Função |
|------------|--------|
| `AppLayout` | Wrapper principal que define a estrutura da página (Outlet + BottomNav). |
| `Header` | Barra superior fixa com título e ações (voltar, filtros). |
| `BottomNav` | Barra de navegação inferior fixa para mobile (Dashboard, Clientes, Nova Venda, Vendas, Menu). |
| `PageContainer`| Container com padding padrão e ajuste para Header/BottomNav fixos. |

---

## Features (`components/features/`)

Componentes de negócio específicos.

### Purchase Orders (`purchase-orders/`)
- `PurchaseOrderForm`: Modal complexo para criação/edição de pedidos de compra.
- `PurchaseOrderPaymentModal`: Modal para registrar pagamentos a fornecedores.
- `ProductNicknamesModal`: Configuração de apelidos (siglas) para produtos.

### Vendas (`vendas/`)
- `PaymentModal`: Modal de checkout para vendas, suportando múltiplas formas de pagamento.

### Dashboard (`dashboard/`)
- `AlertasFinanceiroWidget`: Widget de contas a receber (fiado).
- `AlertasRecompraWidget`: Widget de retensão de clientes (churn).
- `EstoqueWidget`: Widget de monitoramento de instock/ruptura.
