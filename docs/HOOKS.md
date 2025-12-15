# Hooks

## useContatos

**Arquivo:** `src/hooks/useContatos.ts`  
**Responsabilidade:** CRUD de contatos + realtime subscription

### Funções exportadas:

#### `useContatos(options?)`
Lista todos os contatos com filtros opcionais e inclui indicador.

```tsx
const { 
  contatos,        // Contato[]
  loading,         // boolean
  error,           // string | null
  refetch,         // () => Promise<void>
  createContato,   // (data) => Promise<Contato | null>
  updateContato,   // (id, data) => Promise<Contato | null>
  deleteContato,   // (id) => Promise<boolean>
  searchContatos,  // (query) => Promise<Contato[]>
  getNomeIndicador,// (id) => string | null (lookup sync)
} = useContatos({ 
  filtros: { busca, tipo, status },
  realtime: true  // default
})
```

#### `useContato(id)`
Busca um contato específico por ID.

```tsx
const { 
  contato,    // Contato | null
  indicador,  // Contato | null (quem indicou)
  loading,    
  error 
} = useContato('uuid-do-contato')
```

---

## useProdutos

**Arquivo:** `src/hooks/useProdutos.ts`  
**Responsabilidade:** CRUD de produtos

### Funções exportadas:

#### `useProdutos(options?)`
Lista produtos com opções de filtro.

```tsx
const { 
  produtos,        // Produto[]
  loading,        
  error,          
  refetch,        
  getProdutoById,  // (id) => Produto | undefined
  createProduto,   // (data) => Promise<Produto | null>
  updateProduto    // (id, data) => Promise<Produto | null>
} = useProdutos({
  includeInactive: false  // default: só ativos
})
```

---

## useRelatorioFabrica

**Arquivo:** `src/hooks/useRelatorioFabrica.ts`  
**Responsabilidade:** Gerar relatório agregado de pedido para fábrica

### Funções exportadas:

#### `useRelatorioFabrica()`
Gera relatório consolidado de vendas por produto em um período.

```tsx
const { 
  relatorio,       // RelatorioData | null
  loading,        
  error,          
  gerarRelatorio   // (dataInicio, dataFim) => Promise<void>
} = useRelatorioFabrica()

// Helper
const { dataInicio, dataFim } = getDefaultDates() // 1º dia do mês até hoje
```

### Tipos:

```tsx
interface ProdutoAgregado {
  produtoId: string
  nome: string
  codigo: string
  quantidade: number
}

interface RelatorioData {
  produtos: ProdutoAgregado[]
  total: number
  dataInicio: string
  dataFim: string
}
```

---

## useVendas

**Arquivo:** `src/hooks/useVendas.ts`  
**Responsabilidade:** CRUD de vendas + métricas + realtime

### Funções exportadas:

#### `useVendas(options?)`
Lista vendas com filtros, calcula métricas e inclui dados profundos de contato/indicador.

```tsx
const { 
  vendas,           // VendaComItens[]
  loading,          
  error,            
  metrics: {
    faturamentoTotal,
    faturamentoMes,
    totalVendas,
    vendasMes,
    ticketMedio,
    produtosVendidos: { total, pote1kg, pote4kg },
    recebido,         // soma vendas pagas
    aReceber,         // soma vendas não pagas
    entregasPendentes,
    entregasRealizadas
  },
  refetch,          
  createVenda,      // (data) => Promise<Venda | null>
  updateVendaStatus,// (id, status) => Promise<boolean>
  updateVendaPago,  // (id, pago) => Promise<boolean>
  deleteVenda,      // (id) => Promise<boolean>
  getVendaById,     // (id) => Promise<VendaComItens | null>
} = useVendas({ 
  filtros: { status, forma_pagamento, periodo, contatoId },  // contatoId adicionado
  realtime: true  // default
})
```

#### `useVenda(id)`
Busca uma venda específica com itens e contato.

```tsx
const { 
  venda,   // VendaComItens | null
  loading,  
  error 
} = useVenda('uuid-da-venda')
```

---

## useIndicacoes

**Arquivo:** `src/hooks/useIndicacoes.ts`  
**Responsabilidade:** Cálculo de indicações derivado de contatos

### Funções exportadas:

#### `useIndicacoes()`
Calcula dados de indicações a partir de `contatos.indicado_por_id`. Normaliza dados relacionais.

```tsx
const { 
  indicadores,       // IndicadorComIndicados[]
  loading,          
  error,            
  totalIndicacoes,   // número total de indicações
  totalConversoes,   // indicações que viraram clientes
  taxaConversao,     // percentual de conversão
  refetch,          
  getIndicadorById,  // (id) => IndicadorComIndicados | undefined
} = useIndicacoes()
```

### Tipo `IndicadorComIndicados`:
```tsx
{
  indicador: Contato,           // Quem indicou
  indicados: Indicado[],        // Lista de indicados
  totalIndicacoes: number,
  indicacoesConvertidas: number, // status === 'cliente'
  recompensaAcumulada: number,   // R$5 por conversão
}
```

---

## useConfiguracoes

**Arquivo:** `src/hooks/useConfiguracoes.ts`  
**Responsabilidade:** Leitura de configurações do sistema

### Funções exportadas:

#### `useConfiguracoes()`
Busca configurações da tabela `configuracoes`.

```tsx
const { 
  config: {
    cicloRecompra: { b2c: 15, b2b: 7 },
    recompensaIndicacao,
    mensagemRecompra,
    taxaEntregaPadrao
  },
  loading,          
  error,            
  refetch,          
  updateConfig,     // (chave, valor) => Promise<boolean>
} = useConfiguracoes()
```

---

## useRecompra

**Arquivo:** `src/hooks/useRecompra.ts`  
**Responsabilidade:** Cálculo de alertas de recompra

### Funções exportadas:

#### `useRecompra()`
Calcula dias desde última compra e classifica por urgência.

```tsx
const { 
  contatos,           // ContatoRecompra[]
  loading,          
  error,            
  atrasados,         // contagem de atrasados
  proximos,          // contagem de próximos
  emDia,             // contagem em dia
  refetch,          
  marcarComoContatado, // (id) => Promise<boolean>
} = useRecompra()
```

### Tipo `ContatoRecompra`:
```tsx
{
  contato: Contato,
  diasSemCompra: number,
  ciclo: number,
  status: 'atrasado' | 'proximo' | 'ok',
  ultimaCompra: Date | null,
}
```

### Lógica de classificação:
- **Atrasado**: `diasSemCompra > ciclo`
- **Próximo**: `diasSemCompra >= ciclo - threshold` (3d B2C, 2d B2B)
- **OK**: dentro do ciclo

---

## Padrões de Hooks

### Retorno padrão:
```tsx
{
  data,      // dados principais
  loading,   // boolean - carregando?
  error,     // string | null - mensagem de erro
  refetch,   // função para recarregar
  // mutations...
}
```

### Realtime:
- Habilitado por padrão via flag `realtime: true`
- Usa `postgres_changes` do Supabase
- Cleanup automático no unmount

### Filtros:
- Aplicados na query Supabase
- Campos com valor `'todos'` são ignorados
