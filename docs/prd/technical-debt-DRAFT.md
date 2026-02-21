# Technical Debt Assessment - DRAFT
## Para Revisão dos Especialistas

### 1. Débitos de Sistema
- **Acoplamento em Hooks**: A camada de lógica de negócio está altamente concentrada em 27+ custom hooks, dificultando a rastreabilidade e testes unitários.
- **Configurações de Ambiente**: Uso de `.env` manual sem validação de schema em runtime, podendo causar erros silenciosos no deploy.
- **Dependências**: Algumas bibliotecas como `@react-three/fiber` e `framer-motion` em versões muito recentes que podem introduzir breaking changes em futuras atualizações se não pinnadas corretamente.

### 2. Débitos de Database
- **RLS Crítico**: 8 tabelas principais (incluindo `contas` e `lancamentos`) estão com Row Level Security desativado. ⚠️ **Ação Imediata Recomendada.**
- **Políticas Permissivas**: Tabelas com RLS ativado estão usando `USING (true)` para usuários autenticados, permitindo visibilidade global de dados que deveriam ser privados.
- **Índices**: Ausência de índices explícitos em chaves estrangeiras críticas observadas em tabelas de grande volume (`itens_venda`).
⚠️ **PENDENTE: Revisão do @data-engineer**

### 3. Débitos de Frontend/UX
- **Tipagem Fraca**: Algumas funções de mapeamento e componentes de listagem ainda utilizam tipos implícitos `any` ou casting de `never` forçado.
- **Otimização Mobile**: Embora o Capacitor esteja integrado, não há evidência de testes específicos de touch-target e safe-areas em todos os modais.
- **Design System**: Uso misto de classes utilitárias ad-hoc e componentes de UI, gerando inconsistências visuais sutis em resoluções 1920px (como relatado anteriormente).
⚠️ **PENDENTE: Revisão do @ux-design-expert**

### 4. Matriz Preliminar

| ID | Débito | Área | Impacto | Esforço | Prioridade |
|----|--------|------|---------|---------|------------|
| DT-001 | RLS Desativado (Financial) | DB | Crítico | Baixo | **P0** |
| DT-002 | Políticas RLS Genéricas | DB | Alto | Médio | **P1** |
| DT-003 | Refatoração de Hooks | Sistema | Médio | Alto | **P2** |
| DT-004 | Padronização Grid 1920px | UX | Médio | Baixo | **P2** |

### 5. Perguntas para Especialistas
- **@data-engineer**: Existe alguma razão legada para as tabelas `contas` e `lancamentos` estarem sem RLS? Qual o impacto de ativar o "KISS policy" (`auth.uid() = created_by`) nelas hoje?
- **@ux-design-expert**: A inconsistência no grid de 1920px é causada pelo span das colunas do Tailwind ou pela ausência de um `max-width` no container principal?

---
*Escrito por: @architect (via Orion)*
