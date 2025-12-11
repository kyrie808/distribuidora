# Decisões Técnicas

## 001 - Supabase desde o MVP

**Data:** Dezembro/2024  
**Contexto:** PRD original sugeria `localStorage` para MVP  
**Decisão:** Usar Supabase desde o início  
**Motivo:**
- Evita refatoração futura
- Habilita multi-device automaticamente
- Realtime sync out-of-the-box
- Backup automático dos dados
- Schema tipado para TypeScript

---

## 002 - TypeScript ao invés de JavaScript

**Data:** Dezembro/2024  
**Contexto:** PRD mencionava `.jsx` em alguns trechos  
**Decisão:** TypeScript com `.tsx/.ts` em todo o projeto  
**Motivo:**
- Type safety em tempo de desenvolvimento
- Autocomplete melhor na IDE
- Menos bugs em runtime
- Tipos gerados do Supabase funcionam nativamente

---

## 003 - Zod + React Hook Form para formulários

**Data:** Dezembro/2024  
**Contexto:** Necessidade de validação robusta  
**Decisão:** Combinar Zod (schemas) + React Hook Form (estado)  
**Motivo:**
- Schemas reutilizáveis
- Validação declarativa
- Performance otimizada (menos re-renders)
- Integração nativa via `@hookform/resolvers`

---

## 004 - Hooks personalizados para Supabase

**Data:** Dezembro/2024  
**Contexto:** Escolha entre Tanstack Query ou hooks customizados  
**Decisão:** Hooks customizados simples (`useContatos`, `useVendas`)  
**Motivo:**
- Menor bundle size
- Controle total sobre realtime
- Curva de aprendizado menor
- Suficiente para complexidade atual

**Trade-off:** Sem cache automático (ok para MVP com realtime)

---

## 005 - BottomNav com FAB central

**Data:** Dezembro/2024  
**Contexto:** Navegação mobile-first  
**Decisão:** BottomNav fixo com 5 itens, sendo o central um FAB elevado (Nova Venda)  
**Motivo:**
- Ação mais frequente (venda) sempre acessível
- Padrão mobile reconhecível
- Hierarquia visual clara

---

## 006 - Atualização automática de status do contato

**Data:** Dezembro/2024  
**Contexto:** PRD define que contato vira "cliente" na primeira venda  
**Decisão:** Hook `useVendas.createVenda()` atualiza `contatos.status` e `ultimo_contato` automaticamente  
**Motivo:**
- Garante consistência de dados
- Menos código na camada de UI
- Regra de negócio encapsulada

---

## 007 - Fluxo de venda em 3 etapas

**Data:** Dezembro/2024  
**Contexto:** UX otimizada para operador no celular com pouco tempo  
**Decisão:** Dividir NovaVenda em 3 telas claras  
**Motivo:**
- Foco em uma tarefa por vez
- Menos scroll
- Botões grandes para toque rápido
- Objetivo de < 30 segundos por venda

---

## 008 - Remoção de Self-Joins no PostgREST

**Data:** Dezembro/2024  
**Contexto:** Queries com joins auto-referenciais (`indicador:contatos!fkey`) causavam erro 400 no Supabase  
**Decisão:** Remover self-joins e buscar dados de indicador separadamente quando necessário  
**Motivo:**
- Sintaxe de self-join não é bem suportada em todas versões do PostgREST
- Queries simples são mais estáveis e debugáveis
- Performance não impactada para volume atual

**Trade-off:** Resolvido — implementamos lookup síncrono `getNomeIndicador()` que busca o nome do indicador da lista de contatos em memória.

---

## 009 - Campo `pago` Boolean para Status de Pagamento

**Data:** Dezembro/2024  
**Contexto:** Usuários marcavam vendas como pagas/entregues por engano e não conseguiam desfazer  
**Decisão:** Adicionar campo `pago: boolean` à tabela `vendas` e criar toggles na UI  
**Motivo:**
- Solução mais simples (boolean) vs. enum de status de pagamento
- Permite correção rápida de erros humanos
- Separação clara entre status de entrega e status de pagamento
- Campo `atualizado_em` já rastreia alterações

**Implementação:**
- Migração: `ALTER TABLE vendas ADD COLUMN pago boolean DEFAULT false`
- Hook: `updateVendaPago(id, pago)`
- UI: Toggle em VendaDetalhe, badges em Vendas e Dashboard

---

## Template para novas decisões

```markdown
## XXX - [Título da Decisão]

**Data:** Mês/Ano  
**Contexto:** [O que motivou a discussão]  
**Decisão:** [O que foi decidido]  
**Motivo:** [Por que essa escolha]  
**Trade-offs:** [O que foi sacrificado, se aplicável]
```
