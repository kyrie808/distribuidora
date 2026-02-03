# Registro de Decisões de Arquitetura (ADR)

## 2026-02-02: UI Overhaul & Domain Shielding

### Decisão
Refatorar a interface para utilizar **Shadcn UI** e **Tailwind CSS** com uma abordagem Mobile-First rigorosa, e blindar a lógica de negócio com uma Camada de Domínio explícita.

### Motivação
- A UI anterior era inconsistente e difícil de manter.
- O acoplamento direto entre componentes React e tipos do banco de dados (Snake Case) gerava erros de lint e refatoração difíceis.
- Necessidade de uma UX "App-like" para operação em campo via celular.

### Detalhes Técnicos
1. **Shadcn Integration**: Adoção de componentes copy-paste localizados em `src/components/ui`. Isso permite customização total (ao contrário de libs fechadas como MUI) mantendo padrões acessíveis (Radix UI).
2. **Domain Layer**: Criação de `src/types/domain.ts` (camelCase). Os componentes UI só conhecem esses tipos. O Service Layer (`src/services/`) é responsável pelo mapeamento `DB <-> Domain`.
3. **Bottom Navigation**: Priorização da navegação inferior para mobile, alinhada aos padrões modernos de UX (polegar alcançável).

---

## 2026-02-01: Modularização do Dashboard

### Decisão
Quebrar o Dashboard monolítico em Widgets independentes (`src/components/dashboard/*Widget.tsx`).

### Motivação
O arquivo `Dashboard.tsx` estava crescendo demais, misturando lógica de financeiro, estoque e CRM.

### Resultado
- `AlertasFinanceiroWidget`: Focado em receber.
- `AlertasRecompraWidget`: Focado em reter.
- `EstoqueWidget`: Focado em controlar.
Cada widget gerencia seu próprio data fetching (on demand) ou recebe dados via prop drilled de um hook container se houver dependência compartilhada (ex: filtro de data global).

---

## 2025-01-30: Supabase como Backend-as-a-Service

### Decisão
Migrar todo o backend (anteriormente Python/FastAPI) para Supabase.

### Motivação
- Simplificação da stack (Serverless).
- Auth, Database e Realtime em uma única plataforma.
- Tipagem automática com TypeScript via `supabase gen types`.

### Estratégia
- Lógica de negócio complexa movida para **Custom Hooks** no frontend ou **Database Functions** (RPC) quando performance for crítica.
- RLS (Row Level Security) para proteção de dados por tenant/usuário (preparado, atualmente policy permissiva para MVP).
