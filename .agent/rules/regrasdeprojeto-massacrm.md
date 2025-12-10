---
trigger: always_on
---

# REGRAS DO PROJETO — MassasCRM

## Contexto
Sistema de gestão comercial para distribuidora de alimentos. Stack: React 18 + TypeScript + Vite + Tailwind + Supabase.

## Documentação Obrigatória
- Ao finalizar cada milestone, ANTES de reportar conclusão:
  1. Atualizar `docs/PROGRESS.md` com o que foi entregue
  2. Atualizar `docs/HOOKS.md` se criou/alterou hooks
  3. Atualizar `docs/COMPONENTS.md` se criou/alterou componentes
  4. Atualizar `docs/PAGES.md` se criou/alterou páginas
  5. Atualizar `docs/DECISIONS.md` se tomou decisão técnica relevante

## Padrões de Código

### TypeScript
- Arquivos de componentes: `.tsx`
- Arquivos de lógica: `.ts`
- Sempre tipar props de componentes
- Usar tipos do `src/types/database.ts` para entidades do Supabase
- Preferir `interface` para objetos, `type` para unions

### Nomenclatura
- Componentes: PascalCase (`ContatoCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useContatos.ts`)
- Funções utilitárias: camelCase (`formatCurrency.ts`)
- Constantes: SCREAMING_SNAKE_CASE (`STATUS_LABELS`)

### Estrutura de Arquivos
```
src/
├── components/
│   ├── ui/          # Componentes genéricos reutilizáveis
│   ├── layout/      # Header, BottomNav, containers
│   └── features/    # Componentes específicos de domínio
├── pages/           # Uma página por rota
├── hooks/           # Custom hooks (um por entidade)
├── lib/             # Clients externos (supabase.ts)
├── types/           # Tipos TypeScript
├── utils/           # Funções puras utilitárias
├── constants/       # Enums, labels, configs estáticas
└── schemas/         # Schemas Zod para validação
```

### Componentes
- Um componente por arquivo
- Props destrutturadas no parâmetro
- Exportar como `export function`, não `export default`
- Componentes UI base não devem ter lógica de negócio

### Hooks
- Um hook principal por entidade (`useContatos`, `useVendas`)
- Separar queries de mutations quando complexo
- Sempre retornar `{ data, isLoading, error }`
- Implementar realtime subscription quando relevante

### Supabase
- Queries via hooks, nunca direto em componentes
- Usar `.select()` específico, evitar `select('*')`
- Tratar erros com try/catch ou `.error`
- Optimistic updates para UX responsiva

## O Que Evitar
- ❌ Criar componente novo se já existe similar em `components/ui/`
- ❌ Lógica de negócio em componentes de UI
- ❌ Instalar dependências sem necessidade clara
- ❌ Código comentado ou console.logs em commits
- ❌ Arquivos órfãos (sem uso)
- ❌ Duplicar queries que já existem em hooks
- ❌ Overengineering (abstrações prematuras)

## Commits
Formato: `tipo: descrição curta`

Tipos:
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração sem mudar comportamento
- `style:` formatação, espaços
- `docs:` documentação
- `chore:` configuração, dependências

## Reportar Conclusão de Milestone
Ao finalizar milestone, incluir:
1. Lista de features implementadas com status
2. Arquivos criados/modificados
3. Screenshot ou gravação do fluxo principal
4. Validação (`tsc --noEmit`, `npm run dev`)
5. Próximos passos sugeridos

## PRD de Referência
O arquivo `PRD-MassasCRM-v1.1-supabase.md` contém especificações detalhadas. Consultar antes de implementar cada milestone.

## Design System
- Primary: violet-600 (#7C3AED)
- Accent: orange-500 (#F97316)
- Success: emerald-500 (#10B981)
- Danger: red-500 (#EF4444)
- Fonte: Inter
- Mobile-first (começar em 375px)
- Usar componentes de `components/ui/` sempre que possível