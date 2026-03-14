# PRODUCT REQUIREMENTS DOCUMENT
## Sistema de Gestão Comercial — Distribuidora Mont Massas

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 — MVP |
| **Data** | Dezembro/2025 |
| **Autor** | Kyrie Performance & Resultados |
| **Status** | Em Desenvolvimento |

---

# 1. VISÃO GERAL DO PRODUTO

## 1.1 Declaração do Produto

> **MassasCRM** é um sistema web de gestão comercial para distribuidoras de alimentos, focado em controle de contatos, vendas, indicações e recompra. Projetado para operar em dispositivos móveis e preparado para futura conversão em aplicativo Android.

## 1.2 Problema

A distribuidora está iniciando operações com 85+ contatos já abordados, vendas acontecendo e indicações orgânicas funcionando. Porém:

- Não há controle estruturado de quem comprou, quando, e quanto
- Indicações não são rastreadas (perda de oportunidade de recompensa)
- Não há sistema de alerta para recompra (cliente esquece de recontatar)
- Visão zero do desempenho comercial (faturamento, ticket médio, conversão)
- Operador principal tem tempo limitado (trabalha em paralelo)

## 1.3 Solução

Um sistema leve, mobile-first, que funciona offline e permite:

1. **Cadastrar e classificar contatos** (lead, cliente, indicador, B2B/B2C)
2. **Registrar vendas** vinculadas a clientes e calcular métricas automaticamente
3. **Rastrear cadeia de indicações** e calcular recompensas
4. **Alertar sobre recompra** baseado em ciclo configurável
5. **Visualizar dashboard** com indicadores de desempenho

## 1.4 Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Tempo para registrar uma venda | < 30 segundos |
| Taxa de adoção pelo operador | 100% das vendas registradas |
| Contatos recontados no tempo certo | > 80% |
| Indicações rastreadas corretamente | 100% |

---

# 2. PERSONAS

## 2.1 Operador Principal (Pai)

- **Contexto:** Trabalha em tempo integral na UPA, opera a distribuidora em paralelo
- **Habilidade técnica:** Básica. Usa WhatsApp, mas não é familiarizado com sistemas complexos
- **Dispositivo principal:** Smartphone Android
- **Necessidade:** Sistema simples, rápido, que funcione no celular durante intervalos no trabalho
- **Frustração:** Perder vendas por esquecer de recontatar clientes

## 2.2 Suporte Operacional (Família + Kyrie)

- **Contexto:** Ajudam na operação (entregas, atendimento), precisam de visibilidade do que está acontecendo
- **Habilidade técnica:** Intermediária a avançada
- **Dispositivo principal:** Smartphone e Desktop
- **Necessidade:** Dashboard para acompanhar métricas, exportar relatórios

---

# 3. STACK TÉCNICA E ARQUITETURA

## 3.1 Stack Escolhida

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Framework | **React 18+** | Base para React Native futuro |
| Build Tool | **Vite** | Rápido, leve, zero config |
| Estilização | **Tailwind CSS** | Produtividade, responsivo nativo |
| Estado Global | **Zustand** | Simples, sem boilerplate |
| Persistência MVP | **localStorage** | Zero infra, funciona offline |
| Persistência Futura | **Supabase** | BaaS, sync multi-device |
| Roteamento | **React Router v6** | Padrão de mercado |
| Ícones | **Lucide React** | Leve, consistente |
| Datas | **date-fns** | Leve, tree-shakeable |
| IDs | **nanoid** | IDs únicos no cliente |

## 3.2 Arquitetura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Botões, inputs, cards, modais
│   └── layout/          # Header, BottomNav, PageContainer
├── pages/               # Páginas da aplicação
│   ├── Dashboard.jsx
│   ├── Contatos.jsx
│   ├── Vendas.jsx
│   ├── Indicacoes.jsx
│   └── Recompra.jsx
├── stores/              # Zustand stores
│   ├── useContatos.js
│   ├── useVendas.js
│   └── useConfig.js
├── utils/               # Helpers e funções utilitárias
│   ├── formatters.js
│   ├── calculations.js
│   └── storage.js
├── hooks/               # Custom hooks
├── constants/           # Constantes e enums
└── App.jsx
```

## 3.3 Decisões Técnicas Documentadas

1. **localStorage no MVP:** Dados ficam no dispositivo. Risco de perda se limpar cache. Aceitável para MVP, migra para Supabase na v2.

2. **Sem autenticação no MVP:** Sistema é single-user. Autenticação entra com Supabase na v2.

3. **PWA-ready:** Configurar manifest.json e service worker desde o início para permitir "instalar" no celular.

4. **Mobile-first:** Todo o design começa pelo mobile (375px). Desktop é bônus.

5. **IDs com nanoid:** Gerar IDs únicos no cliente sem depender de backend.

---

# 4. ESTRUTURA DE DADOS

## 4.1 Entidade: Contato

```typescript
interface Contato {
  id: string;                    // nanoid
  nome: string;                  // Nome completo
  telefone: string;              // Formato: (11) 99999-9999
  tipo: "B2C" | "B2B";           // Pessoa física ou estabelecimento
  subtipo?: string;              // B2B: "padaria", "lanchonete", "cantina", etc.
  status: "lead" | "cliente" | "inativo";
  origem: "direto" | "indicacao";
  indicadoPorId?: string;        // ID do contato que indicou
  endereco?: string;             // Endereço de entrega
  bairro?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
```

## 4.2 Entidade: Venda

```typescript
interface ItemVenda {
  produto: string;               // código do produto
  quantidade: number;
  precoUnitario: number;         // Permite ajuste de preço
  subtotal: number;
}

interface Venda {
  id: string;
  contatoId: string;             // FK para Contato
  data: Date;                    // Data da venda
  dataEntrega?: Date;            // Data de entrega (pode ser diferente)
  itens: ItemVenda[];
  total: number;
  formaPagamento: "pix" | "dinheiro" | "cartao" | "fiado";
  status: "pendente" | "entregue" | "cancelada";
  observacoes?: string;
  criadoEm: Date;
}
```

## 4.3 Entidade: Indicacao (derivada)

```typescript
// Não é entidade separada - calculada a partir de Contato.indicadoPorId
interface IndicacaoResumo {
  indicadorId: string;           // Quem indicou
  indicadorNome: string;
  indicados: Array<{             // Quem foi indicado
    id: string;
    nome: string;
    status: string;
    totalCompras: number;
  }>;
  totalIndicacoes: number;
  indicacoesConvertidas: number; // status === "cliente"
  recompensaAcumulada: number;   // Baseado em regra configurável
}
```

## 4.4 Entidade: Produto

```typescript
interface Produto {
  id: string;
  nome: string;                  // "Massa Pão de Queijo 1kg"
  codigo: string;                // "pao_queijo_1kg"
  preco: number;                 // Preço de venda
  custo: number;                 // Custo de compra (do fabricante)
  unidade: string;               // "kg", "unidade"
  ativo: boolean;
}

// Produtos iniciais:
const PRODUTOS_INICIAIS = [
  { codigo: "pao_queijo_1kg", nome: "Massa Pão de Queijo 1kg", preco: 21.99, custo: 13.00 },
  { codigo: "pao_queijo_4kg", nome: "Massa Pão de Queijo 4kg", preco: 59.90, custo: 41.00 }
];
```

## 4.5 Entidade: Configuracao

```typescript
interface Configuracao {
  cicloRecompraB2C: number;      // Dias (default: 15)
  cicloRecompraB2B: number;      // Dias (default: 7)
  recompensaIndicacao: {
    tipo: "desconto" | "produto_gratis";
    valor: number;               // R$ de desconto ou qtd para ganhar grátis
    minIndicacoes: number;       // Mínimo de indicações convertidas
  };
  taxaEntregaPadrao: number;     // R$ (default: 0, a combinar)
  mensagemRecompra: string;      // Template de mensagem
}
```

---

# 5. FUNCIONALIDADES DETALHADAS

## 5.1 Dashboard

**Objetivo:** Visão geral do desempenho comercial em uma única tela.

**Componentes:**
- **Cards de métricas:** Faturamento do mês, Vendas do mês, Ticket médio, Contatos ativos
- **Lista de alertas:** Contatos para recompra (ordenados por urgência)
- **Top indicadores:** Ranking dos 5 melhores indicadores
- **Últimas vendas:** 5 vendas mais recentes com status

**Critérios de Aceite:**
- [ ] Métricas atualizam em tempo real ao registrar venda
- [ ] Alertas de recompra mostram quantos dias desde última compra
- [ ] Clicar em contato de recompra abre WhatsApp com mensagem pré-preenchida
- [ ] Dashboard carrega em menos de 2 segundos

---

## 5.2 Gestão de Contatos

**Objetivo:** Cadastrar, visualizar e gerenciar todos os contatos da distribuidora.

**Telas:**
- **Lista de contatos:** Busca, filtros (tipo, status, origem), ordenação
- **Detalhe do contato:** Dados, histórico de compras, indicações feitas/recebidas
- **Formulário de cadastro/edição:** Campos obrigatórios e opcionais

**Critérios de Aceite:**
- [ ] Busca funciona por nome e telefone
- [ ] Ao cadastrar, se origem = indicação, campo "indicado por" aparece com autocomplete
- [ ] Telefone valida formato e não permite duplicatas
- [ ] Botão de WhatsApp abre conversa com o número do contato
- [ ] Detalhe mostra total gasto e número de compras do contato

---

## 5.3 Registro de Vendas

**Objetivo:** Registrar vendas de forma rápida, vinculando a clientes existentes ou novos.

**Fluxo principal:**
1. Selecionar cliente (autocomplete por nome/telefone) OU cadastrar novo
2. Adicionar produtos (seletor de quantidade com + e -)
3. Selecionar forma de pagamento
4. Confirmar venda

**Critérios de Aceite:**
- [ ] Registrar venda em no máximo 30 segundos (fluxo otimizado)
- [ ] Total calcula automaticamente
- [ ] Se cliente é novo, formulário inline de cadastro rápido (só nome e telefone)
- [ ] Após confirmar, status do contato muda para "cliente" automaticamente
- [ ] Opção de "repetir última compra" para clientes recorrentes

---

## 5.4 Sistema de Indicações

**Objetivo:** Rastrear cadeia de indicações e calcular recompensas.

**Componentes:**
- **Ranking de indicadores:** Lista ordenada por indicações convertidas
- **Detalhe do indicador:** Quem indicou, status de cada indicação, recompensa acumulada
- **Configuração de recompensa:** Definir regras (ex: R$5 desconto por indicação ou 1 grátis a cada 5)

**Critérios de Aceite:**
- [ ] Indicação só conta como "convertida" quando indicado faz primeira compra
- [ ] Recompensa calcula automaticamente baseado em config
- [ ] Botão para "notificar indicador" sobre recompensa (abre WhatsApp)

---

## 5.5 Alertas de Recompra

**Objetivo:** Notificar sobre clientes que devem ser recontados baseado em ciclo configurável.

**Lógica:**
- Calcular dias desde última compra de cada cliente ativo
- Comparar com ciclo configurado (B2C: 15 dias, B2B: 7 dias)
- Classificar: Verde (ainda tem tempo), Amarelo (próximo), Vermelho (atrasado)

**Critérios de Aceite:**
- [ ] Lista ordenada por urgência (vermelho primeiro)
- [ ] Clicar no contato abre WhatsApp com mensagem sugerida
- [ ] Mensagem sugerida é personalizável nas configurações
- [ ] Após enviar mensagem, pode marcar como "contatado" (não reseta timer de compra)

---

# 6. DESIGN SYSTEM

## 6.1 Paleta de Cores

| Cor | HEX | Uso |
|-----|-----|-----|
| Primary | `#7C3AED` | Botões primários, header, destaques |
| Accent | `#F97316` | CTAs secundários, badges, alertas |
| Success | `#10B981` | Confirmações, status positivo |
| Danger | `#EF4444` | Erros, alertas críticos, deletar |
| Warning | `#F59E0B` | Alertas de atenção |
| Background | `#F3F4F6` | Fundo de tela |
| Surface | `#FFFFFF` | Cards, modais |
| Text Primary | `#1F2937` | Texto principal |
| Text Secondary | `#6B7280` | Texto secundário |

## 6.2 Tipografia

- **Fonte:** Inter (Google Fonts) — fallback: system-ui
- **Tamanhos:** xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px)
- **Pesos:** Regular (400), Medium (500), Semibold (600), Bold (700)

## 6.3 Componentes Base

```jsx
// Botão Primário
<button className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors">
  Texto
</button>

// Card
<div className="bg-white rounded-xl shadow-sm p-4">
  {children}
</div>

// Input
<input className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />

// Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
  Label
</span>
```

## 6.4 Bottom Navigation

5 itens fixos:
1. **Dashboard** (ícone: LayoutDashboard)
2. **Contatos** (ícone: Users)
3. **+ Venda** (ícone: Plus, destaque central)
4. **Indicações** (ícone: Share2)
5. **Recompra** (ícone: Bell)

## 6.5 Padrões de UX

- **Feedback imediato:** Toast de confirmação após cada ação
- **Estados de loading:** Skeleton loading em listas
- **Estados vazios:** Ilustração + CTA para primeira ação
- **Confirmação de ações destrutivas:** Modal antes de deletar
- **Pull to refresh:** Em listas principais

---

# 7. MILESTONES E CHECKLIST

> **Instruções:** Marque cada item com ✓ quando concluído. Cada milestone deve ser commitado separadamente no repositório.

---

## MILESTONE 0: Setup do Projeto
**Tempo estimado: 1-2 horas**

- [ ] Criar projeto com Vite + React
  ```bash
  npm create vite@latest massas-crm -- --template react
  cd massas-crm
  ```
- [ ] Instalar e configurar Tailwind CSS
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Instalar dependências
  ```bash
  npm install react-router-dom zustand date-fns lucide-react nanoid
  ```
- [ ] Configurar estrutura de pastas conforme arquitetura
- [ ] Configurar ESLint + Prettier
- [ ] Criar componentes base de UI (Button, Input, Card, Modal)
- [ ] Configurar React Router com rotas principais
- [ ] Criar layout base (Header, BottomNav, PageContainer)
- [ ] Configurar PWA (manifest.json, ícones, service worker básico)
- [ ] **Commit:** `feat: project setup with Vite, React, Tailwind`

---

## MILESTONE 1: Gestão de Contatos
**Tempo estimado: 3-4 horas**

### Store
- [ ] Criar `useContatos` store com Zustand
- [ ] Implementar persistência com localStorage
- [ ] Actions: `addContato`, `updateContato`, `deleteContato`, `getContatoById`
- [ ] Selectors: todos, filtrados por status, filtrados por tipo

### Lista de Contatos
- [ ] Criar página `Contatos.jsx`
- [ ] Implementar lista com cards de contato
- [ ] Campo de busca (nome e telefone)
- [ ] Filtros: tipo (B2C/B2B), status (lead/cliente/inativo)
- [ ] Ordenação: nome, data de cadastro, última compra
- [ ] FAB para adicionar novo contato
- [ ] Estado vazio com ilustração e CTA

### Formulário de Contato
- [ ] Criar componente `ContatoForm` (modal ou página)
- [ ] Campos: nome*, telefone*, tipo*, subtipo (se B2B), origem, indicadoPorId
- [ ] Validação de telefone (formato brasileiro)
- [ ] Validação de duplicata (telefone único)
- [ ] Autocomplete para campo "indicado por"
- [ ] Modo edição com dados pré-preenchidos

### Detalhe do Contato
- [ ] Criar página `ContatoDetalhe.jsx`
- [ ] Exibir todos os dados do contato
- [ ] Botão WhatsApp (abre wa.me com número)
- [ ] Histórico de compras (lista vazia por enquanto)
- [ ] Indicações feitas (lista de quem indicou)
- [ ] Botões: Editar, Deletar (com confirmação)

- [ ] **Commit:** `feat: contact management module`

---

## MILESTONE 2: Cadastro de Produtos
**Tempo estimado: 1-2 horas**

- [ ] Criar `useProdutos` store
- [ ] Seed com produtos iniciais (pao_queijo_1kg, pao_queijo_4kg)
- [ ] Actions: `addProduto`, `updateProduto`, `toggleAtivo`
- [ ] Criar página `Produtos.jsx` (acesso via Configurações)
- [ ] Lista de produtos com preço e margem
- [ ] Formulário para adicionar/editar produto
- [ ] **Commit:** `feat: product management`

---

## MILESTONE 3: Registro de Vendas
**Tempo estimado: 4-5 horas**

### Store
- [ ] Criar `useVendas` store
- [ ] Persistência com localStorage
- [ ] Actions: `addVenda`, `updateVenda`, `cancelVenda`
- [ ] Selectors: todas, por cliente, por período, por status
- [ ] Cálculos: faturamento, ticket médio, total por produto

### Fluxo de Nova Venda
- [ ] Criar página `NovaVenda.jsx` (acesso pelo FAB central)
- [ ] Step 1: Selecionar cliente (autocomplete) ou cadastrar novo (inline)
- [ ] Step 2: Selecionar produtos com quantidade (botões + e -)
- [ ] Step 3: Forma de pagamento + observações
- [ ] Resumo com total antes de confirmar
- [ ] Confirmação com feedback visual (toast + animação)
- [ ] Atualizar status do contato para "cliente" se era "lead"

### Lista de Vendas
- [ ] Criar página `Vendas.jsx`
- [ ] Lista com cards mostrando: cliente, data, total, status
- [ ] Filtros: período, status, forma de pagamento
- [ ] Ordenação por data
- [ ] Ação rápida: marcar como entregue

### Detalhe da Venda
- [ ] Criar página `VendaDetalhe.jsx`
- [ ] Exibir todos os itens, valores, cliente, status
- [ ] Botões: marcar entregue, cancelar (com confirmação)
- [ ] Link para contato do cliente

- [ ] **Commit:** `feat: sales registration module`

---

## MILESTONE 4: Sistema de Indicações
**Tempo estimado: 2-3 horas**

- [ ] Criar página `Indicacoes.jsx`
- [ ] Calcular dados de indicação a partir de contatos (derivado, não armazenado)
- [ ] Ranking de indicadores ordenado por conversões
- [ ] Card do indicador: nome, total indicações, convertidas, recompensa
- [ ] Detalhe do indicador: lista de indicados com status
- [ ] Botão para notificar indicador (WhatsApp com mensagem de recompensa)
- [ ] Configuração de regra de recompensa (em Configurações)
- [ ] **Commit:** `feat: referral tracking system`

---

## MILESTONE 5: Alertas de Recompra
**Tempo estimado: 2-3 horas**

- [ ] Criar página `Recompra.jsx`
- [ ] Calcular dias desde última compra para cada cliente ativo
- [ ] Classificar por status: verde (ok), amarelo (próximo), vermelho (atrasado)
- [ ] Lista ordenada por urgência
- [ ] Card mostra: nome, última compra, dias, status colorido
- [ ] Botão para contatar via WhatsApp com mensagem sugerida
- [ ] Opção de marcar como "contatado" (não reseta timer de compra)
- [ ] Configuração de ciclos de recompra (B2C e B2B) em Configurações
- [ ] Template de mensagem editável
- [ ] **Commit:** `feat: repurchase alert system`

---

## MILESTONE 6: Dashboard
**Tempo estimado: 3-4 horas**

### Cards de Métricas
- [ ] Faturamento do mês (soma de vendas entregues no mês atual)
- [ ] Quantidade de vendas do mês
- [ ] Ticket médio
- [ ] Total de contatos ativos (status = cliente)
- [ ] Comparativo com mês anterior (% de variação)

### Seções
- [ ] Alertas de recompra (top 5 mais urgentes)
- [ ] Top 3 indicadores do mês
- [ ] Últimas 5 vendas
- [ ] Cada seção com link "ver todos"

### UX
- [ ] Pull to refresh
- [ ] Loading skeleton
- [ ] Atualização em tempo real ao registrar venda
- [ ] **Commit:** `feat: dashboard with metrics`

---

## MILESTONE 7: Configurações
**Tempo estimado: 1-2 horas**

- [ ] Criar `useConfig` store
- [ ] Criar página `Configuracoes.jsx`
- [ ] Seção: Ciclos de recompra (B2C e B2B em dias)
- [ ] Seção: Regra de recompensa por indicação
- [ ] Seção: Template de mensagem de recompra
- [ ] Seção: Gerenciar produtos (link para Produtos.jsx)
- [ ] Seção: Exportar dados (JSON)
- [ ] Seção: Importar dados (JSON)
- [ ] Seção: Limpar todos os dados (com confirmação dupla)
- [ ] **Commit:** `feat: settings page`

---

## MILESTONE 8: Polish e PWA
**Tempo estimado: 2-3 horas**

### PWA
- [ ] Ícones em todos os tamanhos (192, 512)
- [ ] manifest.json completo
- [ ] Service worker para cache offline
- [ ] Splash screen configurada
- [ ] Testar "Add to Home Screen" no Android

### Polish
- [ ] Revisar todos os estados vazios
- [ ] Revisar todos os toasts de feedback
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar com dados reais (85 contatos)
- [ ] Otimizar performance (lazy loading, memoization)
- [ ] **Commit:** `feat: PWA setup and polish`

---

## MILESTONE 9: Deploy e Entrega
**Tempo estimado: 1 hora**

- [ ] Build de produção
  ```bash
  npm run build
  ```
- [ ] Deploy na Vercel (ou Netlify)
- [ ] Configurar domínio (se houver)
- [ ] Testar em produção
- [ ] Documentar acesso para o cliente
- [ ] Criar backup da versão inicial
- [ ] **Commit:** `release: v1.0.0 MVP`

---

# 8. ROADMAP FUTURO (PÓS-MVP)

## v1.1 — Sync e Multi-device
- Migrar persistência para Supabase
- Autenticação (login com celular)
- Sync entre dispositivos em tempo real

## v1.2 — Relatórios e Exportação
- Relatório mensal em PDF
- Exportação para Excel
- Gráficos de evolução

## v2.0 — App Android Nativo
- Migrar para React Native
- Notificações push de recompra
- Publicar na Play Store

## v2.1 — Integrações
- Integração com WhatsApp Business API
- Envio automático de mensagens de recompra
- Integração com gateway de pagamento

---

# 9. REFERÊNCIA RÁPIDA

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## Estrutura de Commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudar comportamento
style: formatação, espaços, etc
docs: documentação
chore: configuração, dependências
```

## Links Úteis

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Lucide Icons](https://lucide.dev/icons)
- [React Router Docs](https://reactrouter.com/en/main)

---

*Documento criado por Kyrie Performance & Resultados*
