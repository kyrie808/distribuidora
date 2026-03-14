# Database Specialist Review - Mont Distribuidora

## Database Specialist Review

### Débitos Validados

| ID | Débito | Severidade | Horas | Prioridade | Notas |
|----|--------|------------|-------|------------|-------|
| DT-001 | RLS Desativado (Financial) | Crítico | 4h | **P0** | Inclui `contas`, `lancamentos` e `plano_de_contas`. Risco de vazamento total. |
| DT-002 | Políticas RLS Genéricas | Alto | 8h | **P1** | Requer refatoração para `auth.uid()` em `vendas`, `produtos` e `contatos`. |
| DT-007 | Missing Indexes (FKs) | Médio | 2h | **P2** | `itens_venda.venda_id` e `itens_venda.produto_id` precisam de índices. |

### Débitos Adicionados
- **Data Consistency**: Verifiquei que não há triggers de `updated_at` em todas as tabelas, o que pode causar desalinhamento no cache do React Query se o timestamp não mudar no banco. (Est.: 4h)

### Respostas ao Architect
- **Razão RLS Desativado**: Provavelmente desativado durante a fase inicial de prototipagem rápida ou importação massiva de dados antigos.
- **Impacto KISS Policy**: Baixo risco de quebra, mas requer garantir que todos os registros existentes tenham um `user_id` válido antes da ativação.

### Recomendações
1. Ativar RLS em tabelas financeiras com políticas restritivas imediatamente.
2. Implementar triggers de auditoria para campos de valor nas `vendas`.

---
*Revisado por: @data-engineer (via Orion)*
