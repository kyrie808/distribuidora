# Componentes

## UI Base (`components/ui/`)

| Componente | Props | Uso |
|------------|-------|-----|
| `Button` | `variant`, `size`, `isLoading`, `disabled`, `leftIcon`, `rightIcon` | Ações primárias e secundárias |
| `Input` | `label`, `error`, `helperText`, `...inputProps` | Campos de texto |
| `Select` | `label`, `error`, `options`, `placeholder` | Dropdowns |
| `Card` | `hover`, `padding`, `className`, `onClick` | Containers com sombra |
| `CardHeader` | `title`, `subtitle`, `action` | Cabeçalho de cards |
| `CardContent` | `children` | Conteúdo de cards |
| `Modal` | `isOpen`, `onClose`, `title`, `size` | Diálogos modais |
| `ModalActions` | `children` | Botões do modal |
| `Toast` | - | Notificações (via `useToast`) |
| `ToastContainer` | - | Container de notificações |
| `Badge` | `variant` | Labels coloridos |
| `Spinner` | `size` | Loading spinner |
| `LoadingScreen` | `message` | Tela de carregamento |
| `EmptyState` | `icon`, `title`, `description`, `action` | Estado vazio de listas |

### Exemplo de uso:

```tsx
import { Button, Card, Input, Badge, Modal } from '@/components/ui'

<Button variant="primary" isLoading={saving}>Salvar</Button>
<Card hover onClick={handleClick}>...</Card>
<Badge variant="success">Ativo</Badge>
```

---

## Layout (`components/layout/`)

| Componente | Props | Uso |
|------------|-------|-----|
| `Header` | `title`, `showBack`, `rightAction` | Cabeçalho de página |
| `BottomNav` | - | Navegação principal (5 itens) |
| `PageContainer` | `noPadding`, `className` | Container de página com padding |
| `AppLayout` | - | Layout principal com Outlet + BottomNav |

### Exemplo de uso:

```tsx
import { Header, PageContainer } from '@/components/layout'

<Header title="Contatos" showBack rightAction={<FilterButton />} />
<PageContainer>
  {/* Conteúdo da página */}
</PageContainer>
```

---

## Features (`components/contatos/`)

| Componente | Props | Uso |
|------------|-------|-----|
| `ContatoCard` | `contato`, `onClick` | Card na lista de contatos |
| `ContatoFormModal` | `isOpen`, `onClose`, `contato`, `onSuccess` | Modal de criação/edição |

### Exemplo de uso:

```tsx
import { ContatoCard, ContatoFormModal } from '@/components/contatos'

<ContatoCard contato={contato} />
<ContatoFormModal isOpen={showModal} onClose={() => setShowModal(false)} />
```

---

## Convenções

### Criando novos componentes:

1. Criar arquivo em `components/{categoria}/NomeComponente.tsx`
2. Exportar via `index.ts` da pasta
3. Props tipadas com interface
4. Usar Tailwind para estilos
5. Documentar aqui após criação
