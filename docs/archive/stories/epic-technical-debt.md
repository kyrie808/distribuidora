# Epic: Hardening & Resolução de Débitos Técnicos (Sprint 4)

## Objetivo do Epic
Endurecer a estabilidade e rastreabilidade do CRM, focando na infraestrutura DevOps do banco de dados, auditoria de segurança e estabilidade do fluxo financeiro. Issues anteriores relativas a UX e responsividade (DT-004 Grid 1920px e DT-008 Loading flashes) foram confirmadas como **CONCLUÍDAS** na Sprint 3.

## Escopo
- Gestão de versão de schema do banco de dados (Supabase local migrations).
- Auditoria fina nas tabelas principais via triggers no banco (`created_by` e `updated_by`).
- Setup da infra de testes automatizados restrito a cálculos financeiros e KPIs críticos.
- Captura de erros de UI de forma elegante (ErrorBoundary global).
- Desacoplamento final do banco na View (Domain Mappers no repositório).

## Critérios de Sucesso
- Histórico de migrations (`supabase/migrations`) configurado e sendo a única fonte da verdade do DB.
- Inserções nas tabelas principais recebem o ID do admin automaticamente via trigger do PostgreSQL.
- Testes cobrindo reduções em `dashboardMetrics.ts` e Mappers.
- Monitores de erro globais instalados (ErrorBoundary exibindo call-to-action em vez de tela branca).

## Lista de Stories (Em Ordem de Prioridade)
1. **[TD-002] Supabase CLI Migrations** (Versionamento e fundação do banco de dados local).
2. **[TD-003] Triggers de Auditoria para `created_by`/`updated_by`** (Injeção via `auth.uid()`).
3. **[TD-001] Setup Vitest (Testes Críticos)** (Foco 100% restrito a cálculos financeiros e KPIs).
4. **[TD-006] Implementação Global de ErrorBoundary** (Prevenir crash de tela em runtime não rastreado pelo TypeScript).
5. **[TD-005] Finalização Domain Shielding Layer** (Mappers puros em TypeScript).

*(Nota: DT-004 e DT-008 foram submetidos à revisão técnica "Brownfield Discovery 2.1" e confirmados como concluídos. Não compõem a Sprint 4).*

## Timeline
2-3 semanas estimadas de esforço. Custo mapeado em ~50h técnicas conjuntas.
