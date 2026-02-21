# Frontend / UX Spec — Mont Distribuidora

**Data:** 2026-02-21  
**Agente:** @ux-design-expert (Brownfield Discovery — FASE 3)  
**Projeto:** distribuidora-prod

---

## 1. Arquitetura Frontend

### Layout System

```
AppLayout
├── PwaUpdateToast (service worker prompt)
├── ToastContainer (global toast)
├── <Outlet /> (page content, pb-20 for nav)
└── BottomNav (fixed bottom, z-50)
    ├── NavButton "Início" → /
    ├── NavButton "Clientes" → /contatos
    ├── FAB "Nova Venda" (elevated -top-5, primary bg, shadow)
    ├── NavButton "Vendas" → /vendas (hidden on /nova-venda)
    └── NavButton "Menu" → /menu
```

**Padrão de página:**
```tsx
<Header title="..." showBack rightAction={...} />
<PageContainer>
  {/* content */}
</PageContainer>
```

### Navegação

| Tipo | Implementação |
|------|--------------|
| **Router** | HashRouter (compatível Capacitor/PWA) |
| **Nav primária** | BottomNav (4 items + FAB) |
| **Nav secundária** | Menu page (/menu) com links para features |
| **Back** | Header showBack → `navigate(-1)` |
| **Deep linking** | Não suportado (HashRouter) |

---

## 2. Inventário de Páginas (por tamanho)

| Página | KB | Complexidade | Responsive | Observação |
|--------|----|-------------|-----------|------------|
| ContatoDetalhe | 39.2 | ⚠️ Alta | ❌ | Detalhes + histórico vendas + ações |
| Configuracoes | 29.7 | ⚠️ Alta | ❌ | Múltiplos forms (perfil, empresa, temas) |
| VendaDetalhe | 24.3 | Alta | ❌ | Detalhes + pagamentos + ações |
| Vendas | 23.8 | Alta | ❌ | Lista filtrada + busca |
| Estoque | 22.4 | Alta | ❌ | Grid + alertas baixo estoque |
| FluxoCaixa | 19.9 | Alta | ❌ | Gráficos + tabela resumo |
| Recompra | 15.3 | Média | ❌ | Lista agrupada por período |
| RelatorioFabrica | 15.2 | Média | ❌ | Tabela + exportação |
| NovaVenda | 14.4 | Alta | ✅ | Wizard multi-step |
| Entregas | 12.6 | Média | ✅ | Lista + mapa |
| Dashboard | 12.5 | Média | ✅ | KPIs + cards |
| Produtos | 12.3 | Média | ❌ | CRUD grid |
| Contatos | 10.3 | Média | ❌ | Lista FTS |
| Ranking | 8.5 | Baixa | ❌ | Tabela classificação |
| LoginPage | 7.2 | Baixa | ❌ | Auth form |
| CatalogoPendentes | 7.1 | Baixa | ❌ | Lista pendentes |
| PedidosCompra | 5.8 | Baixa | ❌ | Lista POs |
| Menu | 5.1 | Baixa | ❌ | Grid de links |
| PlanoDeContas | 4.9 | Baixa | ❌ | CRUD simples |

> ⚠️ **Apenas 3 de 19 páginas** possuem breakpoints responsivos (lg:/xl:).

---

## 3. Componentes UI (14 primitives)

| Componente | Padrão | Variantes |
|-----------|--------|-----------|
| Button | CVA (class-variance-authority) | default, destructive, outline, ghost, link + sizes |
| Badge | CVA | default, secondary, destructive, outline |
| Card | Compound (Card, CardHeader, CardContent, CardFooter) | — |
| Input | forwardRef | — |
| Select | Native `<select>` | — |
| Modal | Portal + backdrop | sizes |
| Toast | Zustand-based store | success, error, warning, info |
| Skeleton | CSS animation | — |
| Spinner | CSS animation | sm, md, lg |
| EmptyState | Icon + message + action | — |
| FloatingDock | framer-motion | — |
| ThemeToggle | localStorage + CSS class | — |
| PwaUpdateToast | service worker API | — |
| StoryFilter | Tabs pattern | — |

### Lacunas de Componentes
- ❌ **Sem sistema de form controls** (label + error + hint)
- ❌ **Sem Combobox/Autocomplete** (busca de contatos é custom inline)
- ❌ **Sem DatePicker** (inputs nativos de data)
- ❌ **Sem Tabs component** genérico
- ❌ **Sem Drawer/Sheet** (mobile patterns)
- ❌ **Sem ConfirmDialog** (deletes usam `window.confirm()`)
- ❌ **Sem Table component** (tabelas são divs inline)
- ❌ **Sem Pagination** (todas as listas carregam tudo)

---

## 4. State Management

| Tipo | Tecnologia | Uso |
|------|-----------|-----|
| **Server state** | TanStack Query | 27 hooks com queries + mutations |
| **Client state** | Zustand | `useCartStore` (carrinho de venda) |
| **Form state** | React Hook Form + Zod | 3 schemas (contato, venda) |
| **UI state** | useState local | Modais, filtros, toggles |
| **Toast** | Zustand-based custom | Global notification system |
| **Theme** | CSS class + localStorage | Dark/light toggle |

---

## 5. Acessibilidade (WCAG Audit)

| Critério | Status | Detalhes |
|---------|--------|---------|
| **aria-label** | 🔴 1 ocorrência | Apenas FAB "Nova Venda" tem aria-label |
| **ARIA roles** | 🔴 0 ocorrências | Nenhum role= em todo o app |
| **Keyboard nav** | 🟡 Parcial | Botões nativos funcionam, custom widgets não |
| **Focus management** | 🔴 Ausente | Modais não trapping focus |
| **Color contrast** | 🟡 Parcial | Neon Green (#13ec13) em branco pode falhar WCAG AA |
| **Screen reader** | 🔴 Ausente | Sem landmarks, sem live regions |
| **Motion reduction** | 🔴 Ausente | Sem `prefers-reduced-motion` para framer-motion |
| **Semantic HTML** | 🟡 Parcial | Header usa `<header>`, mas nav não usa `<nav>` corretamente |

---

## 6. Performance Frontend

| Aspecto | Status | Detalhes |
|---------|--------|---------|
| **Code splitting** | 🔴 Ausente | Zero `React.lazy()` — bundle único |
| **Image optimization** | 🟡 Parcial | PWA cache, mas sem lazy loading de imagens |
| **Bundle size** | 🟡 Alto | Three.js + leva (~600KB) não utilizados |
| **Query caching** | ✅ | TanStack Query com staleTime configurado |
| **Skeleton loading** | ✅ | Skeleton component usado em várias páginas |
| **Pagination** | 🔴 Ausente | Listas carregam todos os registros |
| **Virtual scroll** | 🔴 Ausente | 341 contatos e 477 vendas renderizados de uma vez |
| **PWA** | ✅ | Service worker, cache 3MB, prompt update |
| **Font loading** | 🟡 | Google Fonts CDN (2 famílias, display=swap) |

---

## 7. Padrões de UX Identificados

### Positivos ✅
1. Mobile-first design com BottomNav e FAB proeminente
2. Skeleton loading states previnem flashes
3. Toast system global consistente (useToast em 20 files)
4. Dark mode com toggle e persistência
5. Full-text search em contatos e vendas
6. Pull-down mental model (bottom nav typical of native apps)
7. ErrorBoundary no root do app

### Negativos / Débitos ❌

| ID | Débito | Severidade | Área |
|----|--------|-----------|------|
| UX-001 | **Zero acessibilidade** — 1 aria-label, 0 roles, sem focus trap | 🔴 Crítica | A11y |
| UX-002 | **Sem code splitting** — bundle monolítico | 🟡 Alta | Performance |
| UX-003 | **Sem paginação/virtual scroll** — 477 vendas renderizadas de uma vez | 🟡 Alta | Performance |
| UX-004 | **Apenas 3/19 páginas responsivas** (lg:/xl:) | 🟡 Alta | Responsive |
| UX-005 | **Páginas monolíticas** — ContatoDetalhe (39KB), Configuracoes (30KB) | 🟡 Alta | Manutenibilidade |
| UX-006 | **`window.confirm()` para deletes** — sem ConfirmDialog | 🟢 Média | UX |
| UX-007 | **Inputs de data nativos** — sem DatePicker consistente | 🟢 Média | UX |
| UX-008 | **Sem Combobox** — busca de contatos é custom inline | 🟢 Média | UX |
| UX-009 | **Sem Pagination component** — listas infinitas | 🟡 Alta | UX |
| UX-010 | **Primary color #13ec13** pode falhar contraste WCAG AA em fundo branco | 🟡 Média | A11y |
| UX-011 | **Sem prefers-reduced-motion** para animações framer-motion | 🟢 Baixa | A11y |
| UX-012 | **BottomNav oculta "Vendas"** quando na rota /nova-venda — UX confuso | 🟢 Média | Nav |

---

*Gerado por @ux-design-expert como parte do workflow brownfield-discovery FASE 3*
