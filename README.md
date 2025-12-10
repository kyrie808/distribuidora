# Gilmar Distribuidor Massas

Sistema de Gestão Comercial para distribuidora de massas artesanais.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **State:** Zustand + React Query patterns

## Funcionalidades

- ✅ Gestão de Contatos (leads, clientes, B2B/B2C)
- ✅ Registro de Vendas (fluxo rápido mobile)
- ✅ Sistema de Indicações (ranking + recompensas)
- ✅ Alertas de Recompra (ciclos configuráveis)
- ✅ Dashboard com métricas
- ✅ Configurações editáveis
- ✅ Integração WhatsApp

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Configuração

Crie um arquivo `.env` com as credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
```
