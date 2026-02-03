# 💀 AUDITORIA DE SYSTEM DESIGN (EXTREME MODE)

**Data:** 02/02/2026
**Responsável:** Antigravity AI
**Status:** 🏗️ EM REFATORAÇÃO

Este relatório analisa a arquitetura atual do frontend e acompanha o progresso da refatoração para corrigir falhas críticas de escalabilidade.

---

## 🚫 Problemas Identificados (Original)

### 1. O "Teste da Persistência" (State Management)
**Arquivo Auditado:** `src/pages/NovaVenda.tsx`
- **Problema:** Estado do carrinho (`cart`) local com `useState`.
- **Consequência:** Perda de dados ao atualizar a página (F5) ou navegar.
- **Status da Solução:** ✅ RESOLVIDO

### 2. Vazamento de Regra de Negócio (Logic Leakage)
**Arquivos Auditados:** `src/pages/Dashboard.tsx`, `src/pages/Produtos.tsx`, `src/hooks/useVendas.ts`
- **Problema:** UI calculando margens e KPIs; Hooks com chamadas diretas ao Supabase ("Fat Hooks").
- **Consequência:** Duplicação de lógica e difícil manutenção.
- **Status da Solução:** ✅ RESOLVIDO (Dashboard & Vendas)

### 3. Acoplamento de Banco de Dados
**Arquivos Auditados:** Todos os principais
- **Problema:** UI depende de tipos gerados automaticamente (`database.types.ts`).
- **Consequência:** Alterações no banco quebram a UI inteira.
- **Status da Solução:** ⚠️ PENDENTE

---

## 🛠️ PLANO DE REFATORAÇÃO & PROGRESSO

### Fase 1: Desacoplar Estado (State Management)
**Objetivo:** Implementar **Zustand** para o Carrinho de Vendas com persistência.

- [x] Instalar `zustand`
- [x] Criar Store `src/stores/useCartStore.ts` com persistência (`localStorage`)
- [x] Refatorar `NovaVenda.tsx` para remover `useState` local
- [x] Implementar ações de `addItem`, `removeItem`, `updateQuantity`, `setCliente`
- [x] Validar persistência entre navegações

### Fase 2: Camada de Serviço (Logic Extraction)
**Objetivo:** Centralizar lógica de negócios e chamadas de API em Serviços.

- [x] Criar `src/services/vendaService.ts`
    - [x] `getVendas()`
    - [x] `calculateKPIs()` (Extraído do Dashboard)
    - [x] `createVenda()` (Lógica transacional)
    - [x] `addPagamento()`
- [x] Refatorar Hook `src/hooks/useVendas.ts`
    - [x] Remover dependência direta de `supabase` (exceto tipos/realtime opcional)
    - [x] Delegar chamadas para `vendaService`
- [x] Limpar `src/pages/Dashboard.tsx`
    - [x] Remover cálculos inline (`.reduce`, `.filter` complexos)
    - [x] Usar apenas métricas prontas do hook

### Fase 3: Blindagem de Domínio (Domain Types & Mappers) [PRÓXIMO]
**Objetivo:** Desacoplar a UI da estrutura do Banco de Dados.

- [ ] Definir Tipos de Domínio (`src/types/domain/`)
    - [ ] `Venda.ts`
    - [ ] `Produto.ts`
- [ ] Criar Mappers (`src/mappers/`)
    - [ ] `VendaMapper.ts` (`toDomain`, `toPersistence`)
- [ ] Refatorar interfaces de UI para usar Tipos de Domínio
- [ ] Isolar tipos do Supabase apenas na camada de Service/Repository

---
**FIM DO RELATÓRIO ATUALIZADO**
