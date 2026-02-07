# Documentação de Componentes

## UI Base (`src/components/ui/`)
Componentes atômicos e reutilizáveis, baseados em Tailwind CSS.

- **Modal.tsx**:
  - Implementado com **React Portal** (`createPortal`) para renderizar no `document.body` e evitar conflitos de Z-Index/Stacking Context.
  - Suporte a tamanhos responsivos: `sm`, `md`, `lg`, `xl`, `2xl`... até `5xl` e `full`.
  - Utilitários CSS para ocultar scrollbar mantendo funcionalidade (`[&::-webkit-scrollbar]:hidden`).
  - Backdrop blur e animações de entrada (`animate-in fade-in zoom-in-95`).

- **Button.tsx**:
  - Variantes: `default` (Solid), `outline` (Borda), `ghost` (Transparente).
  - Suporte a `isLoading` com spinner automático.
- **Card**: Container padrão com bordas arredondadas e sombra suave.

## Layout (`src/components/layout/`)
Estrutura das páginas.

- **Header**: Barra de navegação superior (Sticky).
  - Props V2: `title`, `showBack`, `centerTitle` (boolean), `rightAction` (ReactNode), `transparent` (boolean).
  - Comportamento: Sticky, glassmorphism, ajusta-se automaticamente ao tema dark/light.
- **PageContainer**: Wrapper de conteúdo com padding responsivo.
  - Comportamento: Background transparente, padding inferior para evitar sobreposição com BottomNav (mobile).

## Features (`src/components/features/`)
Componentes específicos de domínio.

### Dashboard
- **KpiCard**: Cartão de métrica com título, valor, tendência e mini-gráfico opcional.
- **LogisticsWidget**: Widget operacional para status de entregas.
- **AlertasFinanceiroWidget**: Lista de clientes com pagamentos pendentes ("Fiado").
- **UltimasVendasWidget**: Lista compacta das vendas mais recentes.

### Contatos
- **ContatoCard**: Card rico com informações do cliente, badges dinâmicas e ações rápidas.
  - Badges: "Novo" (criado < 7 dias), "Lead", "Cliente", "Inativo".

### Vendas
- **CartSidebar**: Sidebar vertical para Desktop e Mobile (Drawer) que exibe o resumo dos itens, total e ações de limpeza/checkout.
- **CheckoutSidebar**: Painel vertical que substitui o carrinho para finalizar a venda.
  - Suporte a Pix, Dinheiro, Cartão e Fiado.
  - Calculadora de troco integrada.
  - Seleção de parcelas e datas de vencimento.
  - Cálculo de taxa de entrega em tempo real.
- **ClientSelector**: Componente de busca e seleção de clientes com feedback visual e link para cadastro.
- **ProductList**: Grid de produtos filtrável com botões rápidos de adição ao carrinho e controle de quantidade.
