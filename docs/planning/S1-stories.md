# Sprint 1 - Security & RLS Stories (Refined)

## Arquitetura de Usuários & Segurança
- **Tenant**: Single-tenant (Mont Distribuidora).
- **Acesso**: Dois administradores (`admin_gilmar`, `admin_pai`).
- **Política Padrão**: `auth.role() = 'authenticated'` para acesso total a dados operacionais/financeiros. **Sem isolamento por UID.**

---

## [STORY-001] Ativação de RLS e Auditoria em Tabelas Financeiras (DT-001)

### User Story
As a **Security Architect**,
I want **to add audit fields and enable Row Level Security (RLS) on financial tables**,
So that **we track record ownership and block unauthorized unauthenticated access**.

### Story Context
**Existing System Integration:**
- **Tables affected**: `vendas`, `lancamentos`, `contatos`, `contas`.
- **Audit Fields**: `created_by` (uuid), `updated_by` (uuid) -> `auth.users(id)`.
- **RLS Lockdown**: `contas`, `lancamentos`, `plano_de_contas`.

### Acceptance Criteria
**Audit Requirements:**
1. Columns `created_by` and `updated_by` must exist in `vendas`, `lancamentos`, `contatos`, `contas`.
2. Foreign keys for these columns must point to `auth.users(id)`.

**Functional Requirements:**
3. RLS must be enabled for tables `contas`, `lancamentos`, and `plano_de_contas`.
4. Initial policy must allow `ALL` for `authenticated` users without `auth.uid()` isolation.

**Integration Requirements:**
5. Authenticated admins (`admin_gilmar`, `admin_pai`) must have full CRUD access.
6. Unauthenticated (`anon`) access must be blocked.

---

## [STORY-002] Refinamento de Políticas Globais (DT-002)

### User Story
As a **Compliance Officer**,
I want **to standardize RLS policies across the system**,
So that **only authenticated users can operate the system, maintaining full access for both admins**.

### Acceptance Criteria
**Functional Requirements:**
1. Remove all generic `USING (true)` or `Enable all access` policies.
2. Implement new policies for `ALL` operations (SELECT, INSERT, UPDATE, DELETE) using `auth.role() = 'authenticated'`.
3. Valid for tables: `produtos`, `vendas`, `contatos`, `contas`, `lancamentos`, `plano_de_contas`.

**Quality Requirements (Impersonate Testing):**
4. Test with `SET ROLE authenticated;`
5. Verify that `admin_gilmar` can view/modify records created by `admin_pai` and vice versa.
6. Verify that `anon` role receives `Insufficient Privileges` or empty results.

---

## Instruções de Teste (Execução Ordenada)

### 1. Preparação (Users)
Criar `admin_gilmar` e `admin_pai` no Supabase Dashboard.

### 2. Auditoria & RLS (Ação)
```sql
-- Exemplo para 'vendas'
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
-- Repetir para lancamentos, plano_de_contas
```

### 3. Políticas (Standardization)
```sql
CREATE POLICY "Full access for authenticated users" 
ON public.tablename 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

### 4. Validação (SQL Editor)
```sql
BEGIN;
SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "USER_UUID"}'; -- Opcional aqui pois não há isolamento por UID
SELECT * FROM public.lancamentos;
ROLLBACK;
```


---
*Preparado por: @sm (River) via Orion*
