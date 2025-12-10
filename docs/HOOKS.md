# Hooks

## useContatos

**Arquivo:** `src/hooks/useContatos.ts`  
**Responsabilidade:** CRUD de contatos + realtime subscription

### Funções exportadas:

#### `useContatos(options?)`
Lista todos os contatos com filtros opcionais.

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
**Responsabilidade:** Leitura de produtos ativos

### Funções exportadas:

#### `useProdutos()`
Lista todos os produtos ativos.

```tsx
const { 
  produtos,       // Produto[]
  loading,        
  error,          
  refetch,        
  getProdutoById  // (id) => Produto | undefined
} = useProdutos()
```

---

## useVendas

**Arquivo:** `src/hooks/useVendas.ts`  
**Responsabilidade:** CRUD de vendas + métricas + realtime

### Funções exportadas:

#### `useVendas(options?)`
Lista vendas com filtros e calcula métricas.

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
    ticketMedio
  },
  refetch,          
  createVenda,      // (data) => Promise<Venda | null>
  updateVendaStatus,// (id, status) => Promise<boolean>
  deleteVenda,      // (id) => Promise<boolean>
  getVendaById,     // (id) => Promise<VendaComItens | null>
} = useVendas({ 
  filtros: { status, forma_pagamento, periodo },
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
Calcula dados de indicações a partir de `contatos.indicado_por_id`.

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
