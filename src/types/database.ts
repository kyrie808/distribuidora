export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            configuracoes: {
                Row: {
                    atualizado_em: string
                    chave: string
                    id: string
                    valor: Json
                }
                Insert: {
                    atualizado_em?: string
                    chave: string
                    id?: string
                    valor: Json
                }
                Update: {
                    atualizado_em?: string
                    chave?: string
                    id?: string
                    valor?: Json
                }
                Relationships: []
            }
            contatos: {
                Row: {
                    atualizado_em: string
                    bairro: string | null
                    criado_em: string
                    endereco: string | null
                    id: string
                    indicado_por_id: string | null
                    nome: string
                    observacoes: string | null
                    origem: string
                    status: string
                    subtipo: string | null
                    telefone: string
                    tipo: string
                    ultimo_contato: string | null
                }
                Insert: {
                    atualizado_em?: string
                    bairro?: string | null
                    criado_em?: string
                    endereco?: string | null
                    id?: string
                    indicado_por_id?: string | null
                    nome: string
                    observacoes?: string | null
                    origem?: string
                    status?: string
                    subtipo?: string | null
                    telefone: string
                    tipo: string
                    ultimo_contato?: string | null
                }
                Update: {
                    atualizado_em?: string
                    bairro?: string | null
                    criado_em?: string
                    endereco?: string | null
                    id?: string
                    indicado_por_id?: string | null
                    nome?: string
                    observacoes?: string | null
                    origem?: string
                    status?: string
                    subtipo?: string | null
                    telefone?: string
                    tipo?: string
                    ultimo_contato?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "contatos_indicado_por_id_fkey"
                        columns: ["indicado_por_id"]
                        isOneToOne: false
                        referencedRelation: "contatos"
                        referencedColumns: ["id"]
                    }
                ]
            }
            itens_venda: {
                Row: {
                    id: string
                    preco_unitario: number
                    produto_id: string
                    quantidade: number
                    subtotal: number
                    venda_id: string
                }
                Insert: {
                    id?: string
                    preco_unitario: number
                    produto_id: string
                    quantidade: number
                    subtotal: number
                    venda_id: string
                }
                Update: {
                    id?: string
                    preco_unitario?: number
                    produto_id?: string
                    quantidade?: number
                    subtotal?: number
                    venda_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "itens_venda_produto_id_fkey"
                        columns: ["produto_id"]
                        isOneToOne: false
                        referencedRelation: "produtos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "itens_venda_venda_id_fkey"
                        columns: ["venda_id"]
                        isOneToOne: false
                        referencedRelation: "vendas"
                        referencedColumns: ["id"]
                    }
                ]
            }
            produtos: {
                Row: {
                    ativo: boolean
                    atualizado_em: string
                    codigo: string
                    criado_em: string
                    custo: number
                    id: string
                    nome: string
                    preco: number
                    unidade: string
                    estoque_atual: number
                }
                Insert: {
                    ativo?: boolean
                    atualizado_em?: string
                    codigo: string
                    criado_em?: string
                    custo: number
                    id?: string
                    nome: string
                    preco: number
                    unidade?: string
                    estoque_atual?: number
                }
                Update: {
                    ativo?: boolean
                    atualizado_em?: string
                    codigo?: string
                    criado_em?: string
                    custo?: number
                    id?: string
                    nome?: string
                    preco?: number
                    unidade?: string
                    estoque_atual?: number
                }
                Relationships: []
            }
            vendas: {
                Row: {
                    atualizado_em: string
                    contato_id: string
                    criado_em: string
                    data: string
                    data_entrega: string | null
                    forma_pagamento: string
                    id: string
                    observacoes: string | null
                    status: string
                    total: number
                    pago: boolean
                    taxa_entrega: number
                    parcelas: number | null
                    data_prevista_pagamento: string | null
                }
                Insert: {
                    atualizado_em?: string
                    contato_id: string
                    criado_em?: string
                    data?: string
                    data_entrega?: string | null
                    forma_pagamento: string
                    id?: string
                    observacoes?: string | null
                    status?: string
                    total: number
                    pago?: boolean
                    taxa_entrega?: number
                    parcelas?: number
                    data_prevista_pagamento?: string | null
                }
                Update: {
                    atualizado_em?: string
                    contato_id: string
                    criado_em?: string
                    data?: string
                    data_entrega?: string | null
                    forma_pagamento?: string
                    id?: string
                    observacoes?: string | null
                    status?: string
                    total?: number
                    pago?: boolean
                    taxa_entrega?: number
                    parcelas?: number
                    data_prevista_pagamento?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "vendas_contato_id_fkey"
                        columns: ["contato_id"]
                        isOneToOne: false
                        referencedRelation: "contatos"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

// Convenience types
export type Contato = Database['public']['Tables']['contatos']['Row']
export type ContatoInsert = Database['public']['Tables']['contatos']['Insert']
export type ContatoUpdate = Database['public']['Tables']['contatos']['Update']

export type Produto = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export type Venda = Database['public']['Tables']['vendas']['Row']
export type VendaInsert = Database['public']['Tables']['vendas']['Insert']
export type VendaUpdate = Database['public']['Tables']['vendas']['Update']

export type ItemVenda = Database['public']['Tables']['itens_venda']['Row']
export type ItemVendaInsert = Database['public']['Tables']['itens_venda']['Insert']

export type Configuracao = Database['public']['Tables']['configuracoes']['Row']

// Extended types with relations
export type VendaComItens = Venda & {
    itens: (ItemVenda & { produto: Produto })[]
    contato: Contato
}

export type ContatoComIndicador = Contato & {
    indicador?: Contato | null
}
