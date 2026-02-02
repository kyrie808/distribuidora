# Progresso do Projeto

## Próximos Passos
- [ ] Implementar autenticação de usuários
- [ ] Criar testes E2E
- [ ] Otimizar queries de dashboard (Server-Side Pagination)

## Entregas Recentes

### 2026-02-01 - Dashboard Financeiro e Modularização
- **Implementado:** Widget de Alertas Financeiros (Fiado)
    - Alerta de atrasados, vencendo hoje e próximos
    - Integração direta com WhatsApp para cobrança
- **Refatorado:** Dashboard Modular
    - Extração de `AlertasRecompraWidget`
    - Criação de `AlertasFinanceiroWidget`
    - Layout responsivo em grid
- **Documentação:**
    - Atualizado `DATABASE.md` com tabelas de pedidos de compra e pagamentos
    - Atualizados `HOOKS.md` e `COMPONENTS.md`

### 2026-02-01 - Refatoração Fluxo de Vendas (Financeiro)
- **Correção:** Persistência de `parcelas` e `data_prevista_pagamento`
- **Feature:** Geração automática de `pagamentos_venda` para vendas à vista
- **QA:** Protocolo de testes de campo executado com sucesso

### 2025-01-31 - Gestão de Pedidos de Compra (Purchase Orders) v1.0
- **Novas Tabelas:** `purchase_orders`, `purchase_order_items`, `purchase_order_payments`
- **Features:** 
  - CRUD completo de pedidos
  - Recebimento de estoque (atualiza produtos)
  - Registro de pagamentos a fornecedores
  - Status automático (Pending -> Received / Unpaid -> Paid)
- **UI:** Telas de listagem, criação e detalhes de pedidos

### 2025-01-XX - MVP Inicial
- Cadastro de Clientes e Produtos
- Lançamento de Vendas Simples
- Dashboard Básico
