import { z } from 'zod'

// Item de venda
export const itemVendaSchema = z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().min(0.001, 'Quantidade inválida'),
    preco_unitario: z.number().min(0.01, 'Preço inválido'),
    subtotal: z.number(),
})

export type ItemVendaFormData = z.infer<typeof itemVendaSchema>

// Venda completa
export const vendaSchema = z.object({
    contato_id: z.string().uuid('Selecione um cliente'),
    data: z.string(),
    data_entrega: z.string().optional().nullable(),
    forma_pagamento: z.enum(['pix', 'dinheiro', 'cartao', 'fiado']),
    observacoes: z.string().optional().nullable(),
    itens: z.array(itemVendaSchema).min(1, 'Adicione pelo menos um produto'),
})

export type VendaFormData = z.infer<typeof vendaSchema>

// Filtros de venda
export const vendaFiltrosSchema = z.object({
    status: z.enum(['pendente', 'entregue', 'cancelada', 'todos']).default('todos'),
    forma_pagamento: z.enum(['pix', 'dinheiro', 'cartao', 'fiado', 'todos']).default('todos'),
    periodo: z.enum(['hoje', 'semana', 'mes', 'todos']).default('todos'),
    contatoId: z.string().optional(),
})

export type VendaFiltros = z.infer<typeof vendaFiltrosSchema>
