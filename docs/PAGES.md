# Páginas

## Dashboard (`/`)

**Arquivo:** `src/pages/Dashboard.tsx`  
**Função:** Overview com métricas e alertas  
**Hooks:** `useVendas`, `useContatos`  
**Componentes:** Header, PageContainer, Card, Badge

**Seções:**
- **💰 Financeiro**: Faturamento mês, Ticket médio, Recebido, A Receber
- **📦 Vendas & Entregas**: Vendas mês, Produtos vendidos, Entregas pendentes/realizadas
- **👥 Clientes**: Clientes ativos
- **🔔 Alertas de Recompra**: Lista de clientes
- **🛒 Últimas Vendas**: 5 vendas mais recentes com status

---

## Contatos (`/contatos`)

**Arquivo:** `src/pages/Contatos.tsx`  
**Função:** Lista de contatos com busca e filtros  
**Hooks:** `useContatos`  
**Componentes:** Header, PageContainer, ContatoCard, EmptyState, Badge, Button

**Features:**
- Busca por nome/telefone
- Filtros por status e tipo
- FAB para novo contato
- Stats (total, clientes, leads)

---

## ContatoDetalhe (`/contatos/:id`)

**Arquivo:** `src/pages/ContatoDetalhe.tsx`  
**Função:** Detalhes do contato + ações  
**Hooks:** `useContato`, `useContatos`  
**Componentes:** Header, PageContainer, Card, Badge, Button, Modal, ContatoFormModal

**Features:**
- Informações completas
- Botão WhatsApp
- Botão Nova Venda
- Edição e exclusão
- Link para indicador

---

## NovaVenda (`/nova-venda`)

**Arquivo:** `src/pages/NovaVenda.tsx`  
**Função:** Fluxo de registro de venda (3 etapas)  
**Hooks:** `useContatos`, `useProdutos`, `useVendas`  
**Componentes:** Header, PageContainer, Card, Button, Badge, Modal, Input

**Etapas:**
1. **Cliente:** Autocomplete ou cadastro rápido
2. **Produtos:** Grid com botões +/-
3. **Pagamento:** Seleção de forma de pagamento

**Features:**
- Cart fixo no bottom
- Cadastro inline de cliente
- Atualização automática de status do contato

---

## Vendas (`/vendas`)

**Arquivo:** `src/pages/Vendas.tsx`  
**Função:** Lista de vendas com filtros  
**Hooks:** `useVendas`  
**Componentes:** Header, PageContainer, Card, Badge, EmptyState, LoadingScreen

**Features:**
- Métricas (faturamento, vendas do mês)
- Filtros por status e período
- Cards com resumo da venda + badges (entrega, pagamento, indicação)

---

## VendaDetalhe (`/vendas/:id`)

**Arquivo:** `src/pages/VendaDetalhe.tsx`  
**Função:** Detalhes da venda + ações  
**Hooks:** `useVenda`, `useVendas`  
**Componentes:** Header, PageContainer, Card, Badge, Button, Modal

**Features:**
- Status da venda + badge de pagamento
- Dados do cliente
- Lista de itens
- Toggle: Marcar Entregue ↔ Voltar para Pendente
- Toggle: Marcar Pago ↔ Desmarcar Pago
- Botão: Restaurar venda cancelada
- Ação: Cancelar (botão vermelho)
- Botão WhatsApp

---

## Indicacoes (`/indicacoes`)

**Arquivo:** `src/pages/Indicacoes.tsx`  
**Função:** Rede de indicações (placeholder)  
**Status:** 🚧 Pendente

---

## Recompra (`/recompra`)

**Arquivo:** `src/pages/Recompra.tsx`  
**Função:** Alertas de recompra (placeholder)  
**Status:** 🚧 Pendente

---

## Rotas (App.tsx)

```tsx
<Route element={<AppLayout />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/contatos" element={<Contatos />} />
  <Route path="/contatos/:id" element={<ContatoDetalhe />} />
  <Route path="/nova-venda" element={<NovaVenda />} />
  <Route path="/vendas" element={<Vendas />} />
  <Route path="/vendas/:id" element={<VendaDetalhe />} />
  <Route path="/indicacoes" element={<Indicacoes />} />
  <Route path="/recompra" element={<Recompra />} />
</Route>
```
