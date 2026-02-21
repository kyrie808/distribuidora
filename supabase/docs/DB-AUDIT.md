# Supabase DB Schema & Audit

## 📊 Estrutura de Tabelas
O banco de dados (public) conta atualmente com as seguintes tabelas principais:
- **Core Entities**: `produtos`, `contatos`
- **Vendas/Caixa**: `vendas`, `itens_venda`, `pagamentos_venda`
- **Catálogo Online**: `cat_pedidos`, `cat_itens_pedido`, `cat_imagens_produto`, `cat_pedidos_pendentes_vinculacao`
- **Gestão de Compras**: `purchase_orders`, `purchase_order_items`, `purchase_order_payments`
- **Financeiro Completo**: `contas`, `plano_de_contas`, `lancamentos`

## 🛡️ Auditoria de Segurança & RLS (Row Level Security)
- **Status RLS**: Ativado na vasta maioria das tabelas após a Sprint 1. Políticas restritas a `auth.role() = 'authenticated'`, garantindo tenant único/admin.
- **Audit Fields**: `criado_em` e `atualizado_em` presentes na maioria das tabelas, embora auditoria complexa com `created_by`/`updated_by` esteja em vias de padronização nas Core Tables (vendas, lancamentos, contatos, contas) conforme planejado em refinamento recente da Sprint 1.

## ⚠️ Débitos de Banco de Dados
1. **Padronização de Audit Fields** (Severidade: Média)
   - *Issue:* Nem todas as tabelas implementam `created_by`/`updated_by` atrelado ao usuário logado, o que dificulta trilha de auditoria fina caso múltiplos admins atuem.
2. **Normalização de FKs em APIs de Terceiros** (Severidade: Baixa)
   - *Issue:* A tabela `cat_pedidos` ainda opera de forma isolada, dependendo da trigger `tr_sync_cat_pedido_to_venda` para replicação de dados. 
3. **Migrações e Controle de Versão** (Severidade: Alta)
   - *Issue:* Não há uso rigoroso do CLI do Supabase para migrations programáticas versionadas localmente via pastas `supabase/migrations/`; as definições de tipo vêm em bloks inteiros para `database.ts`.
