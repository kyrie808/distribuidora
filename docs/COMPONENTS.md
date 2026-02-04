# Componentes

## UI Base (`components/ui/`)

Biblioteca de componentes baseada em [Shadcn UI](https://ui.shadcn.com/), utilizando Tailwind CSS e Radix UI primitives.

| Componente | Props Principais | Descrição |
|------------|------------------|-----------|
| `Button` | `variant`, `size`, `isLoading` | Botão interativo com suporte a estados de loading e variantes. |
| `Card` | `hover`, `onClick`, `className` | Container padrão. **Nota:** Remover prop `padding` (deprecated), usar classes tailwind. |
| `Input` | `label`, `error`, `helperText` | Campo de entrada de texto com label e erro integrados. |
| `Select` | `label`, `error`, `options` | Componente de seleção nativo estilizado. |
| `Badge` | `variant` | Etiquetas de status (success, warning, gray, etc). |
| `Modal` | `isOpen`, `onClose`, `title` | Diálogo modal responsivo. |
| `Toast` | `type`, `message` | Notificações flutuantes. |
| `Spinner` | `size` | Indicador de carregamento. |
| `EmptyState` | `title`, `description`, `icon` | Placeholder visual para listas vazias. |
| `LoadingScreen`| `message` | Tela cheia de carregamento. |
| `ThemeToggle`| | Botão sun/moon com animação transform. |

## Layout (`components/layout/`)

Componentes estruturais da aplicação.

| Componente | Função |
|------------|--------|
| `AppLayout` | Wrapper principal (Outlet + BottomNav). |
| `Header` | Barra superior fixa. |
| `BottomNav` | Navegação inferior mobile (Links: Dashboard, Vendas, Nova Venda, Clientes, Menu). |
| `PageContainer`| Wrapper de conteúdo com espaçamentos padrão. |

## Features (`components/features/` & subpastas)

Componentes de negócio específicos.

### Contatos (`components/contatos/`)
- `ContatoCard`: Card de resumo do cliente. Usa `DomainContato` types.
- `ContatoFormModal`: Modal de criação/edição. Gerencia autocomplete de indicação e busca de CEP.

### Dashboard (`components/dashboard/`)
- `AlertasFinanceiroWidget`: Painel de "Fiado" e cobranças (Regime de Caixa).
- `AlertasRecompraWidget`: Monitor de churn/recompra.
- `EstoqueWidget`: Indicadores de nível de estoque.
- `TopIndicadoresWidget`: Ranking visual com medalhas para os top indicadores.
- `UltimasVendasWidget`: Lista truncada das vendas mais recentes no período selecionado.
- `LogisticsWidget`: Resumo de status de entregas (Pendentes vs Entregues).
- `DashboardCarousel`: Wrapper para widgets secundários (Alertas) em layout mobile.

### Vendas (`components/vendas/`) e Outros
(Componentes sendo migrados gradualmente para pastas de features)
