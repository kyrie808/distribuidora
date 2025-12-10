# Arquitetura do Gilmar Distribuidor Massas

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 7.x | Build Tool |
| Tailwind CSS | 4.x | Styling |
| React Router | 7.x | Navegação |
| Supabase | @supabase/supabase-js 2.x | Backend (DB + Auth + Realtime) |
| Zustand | 5.x | State Management |
| Zod | 4.x | Schema Validation |
| React Hook Form | 7.x | Form Management |
| date-fns | 4.x | Date Utilities |
| Lucide React | 0.x | Icons |

## Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                 # Componentes base reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts
│   ├── layout/             # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── PageContainer.tsx
│   │   ├── AppLayout.tsx
│   │   └── index.ts
│   └── contatos/           # Componentes de features
│       ├── ContatoCard.tsx
│       ├── ContatoFormModal.tsx
│       └── index.ts
├── hooks/                  # Custom hooks (queries Supabase)
│   ├── useContatos.ts
│   ├── useProdutos.ts
│   ├── useVendas.ts
│   └── index.ts
├── pages/                  # Páginas/Rotas
│   ├── Dashboard.tsx
│   ├── Contatos.tsx
│   ├── ContatoDetalhe.tsx
│   ├── NovaVenda.tsx
│   ├── Vendas.tsx
│   ├── VendaDetalhe.tsx
│   ├── Indicacoes.tsx
│   ├── Recompra.tsx
│   └── index.ts
├── schemas/                # Schemas Zod para validação
│   ├── contato.ts
│   ├── venda.ts
│   └── index.ts
├── lib/                    # Bibliotecas/Clients
│   └── supabase.ts
├── types/                  # TypeScript types
│   └── database.ts         # Tipos gerados do Supabase
├── constants/              # Constantes e enums
│   └── index.ts
├── utils/                  # Utilitários
│   ├── formatters.ts
│   └── calculations.ts
├── App.tsx                 # Rotas principais
├── main.tsx                # Entry point
└── index.css               # Estilos globais + Tailwind
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │contatos │  │produtos │  │ vendas  │  │ itens_venda  │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬───────┘   │
└───────┼────────────┼───────────┼───────────────┼───────────┘
        │            │           │               │
        ▼            ▼           ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT HOOKS                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │useContatos │ │useProdutos │ │ useVendas  │              │
│  │  CRUD +    │ │   READ     │ │  CRUD +    │              │
│  │  Realtime  │ │            │ │  Metrics   │              │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
└────────┼──────────────┼──────────────┼─────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTS                               │
│  Pages → Layout → Feature Components → UI Components        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI (DOM)                               │
│             Mobile-first, BottomNav, Cards                  │
└─────────────────────────────────────────────────────────────┘
```

## Padrões Adotados

### Nomenclatura
- **Arquivos**: PascalCase para componentes (`ContatoCard.tsx`), camelCase para utils (`formatters.ts`)
- **Hooks**: Prefixo `use` (`useContatos`, `useVendas`)
- **Tipos**: Prefixo do domínio (`Contato`, `Venda`, `ContatoFormData`)
- **Constantes**: SCREAMING_SNAKE_CASE (`CONTATO_STATUS_LABELS`)

### Componentes
- Functional components only
- Props tipadas com interfaces
- `forwardRef` para inputs de formulário
- Barrel exports via `index.ts`

### Hooks
- Retornam objeto com `{ data, loading, error, ...mutations }`
- Supabase realtime opcional via flag
- Filtros opcionais via parâmetro

### Formulários
- Validação com Zod + React Hook Form
- Schemas em `src/schemas/`
- Mensagens de erro em português

### Estilização
- Tailwind CSS com design tokens customizados
- Classes base em `index.css` (`.btn-primary`, `.card`, `.input`)
- Mobile-first responsive
