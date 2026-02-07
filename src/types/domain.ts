export type VendaStatus = 'pendente' | 'entregue' | 'cancelada'
export type PagamentoMetodo = 'pix' | 'dinheiro' | 'cartao' | 'fiado' | 'brinde' | 'pre_venda'
export type PagamentoStatus = 'pendente' | 'pago'

export interface DomainContato {
    id: string
    nome: string
    telefone: string
    email?: string | null
    tipo: 'B2C' | 'B2B'
    subtipo?: string | null
    status: 'lead' | 'cliente' | 'inativo'
    origem: 'direto' | 'indicacao'
    indicadoPorId?: string | null
    indicador?: {
        id: string
        nome: string
    } | null
    endereco?: string | null
    cep?: string | null
    bairro?: string | null
    lat?: number | null
    lng?: number | null
    observacoes?: string | null
    criadoEm: string
    atualizadoEm: string
}

export interface DomainProduto {
    id: string
    nome: string
    codigo: string
    preco: number
    unidade?: string
    apelido?: string | null
    ativo: boolean
    custo: number
    estoqueAtual: number
    estoqueMinimo: number
    criadoEm: string
    atualizadoEm: string
}

export interface DomainItemVenda {
    id: string
    produtoId: string
    produto?: DomainProduto
    quantidade: number
    precoUnitario: number
    subtotal: number
}

export interface DomainPagamento {
    id: string
    vendaId: string
    valor: number
    data: string
    metodo: PagamentoMetodo
    status: PagamentoStatus
    observacao?: string | null
}

export interface DomainVenda {
    id: string
    contatoId: string
    contato?: DomainContato
    data: string // ISO Date
    total: number
    custoTotal?: number
    status: VendaStatus
    pago: boolean
    formaPagamento: PagamentoMetodo
    taxaEntrega: number
    itens: DomainItemVenda[]
    pagamentos: DomainPagamento[]
    criadoEm: string
    valorPago: number
}
