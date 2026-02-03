import { supabase } from '../lib/supabase'
import type { Venda, ItemVenda, PagamentoVenda } from '../types/database'
import type { VendaFormData, PagamentoFormData } from '../schemas/venda'
import type { DomainVenda } from '../types/domain'
import { toDomainVenda } from './mappers'
import { startOfDay, endOfDay } from 'date-fns'

// Internal type for DB response, not exposed anymore
export interface VendaComItens extends Venda {
    itens: (ItemVenda & {
        produto?: {
            id: string
            nome: string
            codigo: string
        }
    })[]
    contato?: {
        id: string
        nome: string
        telefone: string
        origem: string
        indicado_por_id?: string | null
        indicador?: {
            id: string
            nome: string
        } | null
        status: string // Needed for mapper
    }
    pagamentos?: PagamentoVenda[]
}

export interface VendasMetrics {
    faturamentoTotal: number
    faturamentoMes: number
    totalVendas: number
    vendasMes: number
    ticketMedio: number
    produtosVendidos: {
        total: number
        pote1kg: number
        pote4kg: number
    }
    recebido: number
    aReceber: number
    entregasPendentes: number
    entregasRealizadas: number
    lucroMes: number
}

export const vendaService = {
    async getVendas(startDate?: Date, endDate?: Date): Promise<DomainVenda[]> {
        let query = supabase
            .from('vendas')
            .select(`
                *,
                contato:contatos(id, nome, telefone, origem, indicado_por_id, status),
                itens:itens_venda(*, produto:produtos(id, nome, codigo)),
                pagamentos:pagamentos_venda(*)
            `)
            .order('criado_em', { ascending: false })

        if (startDate) {
            query = query.gte('criado_em', startOfDay(startDate).toISOString())
        }
        if (endDate) {
            query = query.lte('criado_em', endOfDay(endDate).toISOString())
        }

        const { data, error } = await query
        if (error) throw error

        const rawVendas = (data || []) as unknown as VendaComItens[]
        return rawVendas.map(toDomainVenda)
    },

    async getVendaById(id: string): Promise<DomainVenda> {
        const { data, error } = await supabase
            .from('vendas')
            .select(`
                *,
                contato:contatos(id, nome, telefone, tipo, status),
                itens:itens_venda(*, produto:produtos(id, nome, codigo, preco, unidade)),
                pagamentos:pagamentos_venda(*)
            `)
            .eq('id', id)
            .order('data', { foreignTable: 'pagamentos_venda', ascending: false })
            .single()

        if (error) throw error
        return toDomainVenda(data as unknown as VendaComItens)
    },

    async createVenda(data: VendaFormData): Promise<DomainVenda> {
        // ... (Insert logic remains similar, but we should return DomainVenda)
        // For brevity/performance, we might just return the ID or re-fetch.
        // Let's keep existing logic but fetch full object to return compliant type

        const { data: vendaData, error: vendaError } = await supabase
            .from('vendas')
            .insert({
                contato_id: data.contato_id,
                data: data.data,
                status: 'pendente',
                total: data.itens.reduce((acc, item) => acc + item.subtotal, 0),
                pago: false,
                forma_pagamento: data.forma_pagamento,
                taxa_entrega: data.taxa_entrega || 0,
            })
            .select()
            .single()

        if (vendaError) throw vendaError
        if (!vendaData) throw new Error('Erro ao criar venda')

        // Insert items
        if (data.itens.length > 0) {
            const { error: itensError } = await supabase.from('itens_venda').insert(
                data.itens.map((item) => ({
                    venda_id: vendaData.id,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: item.subtotal,
                    custo_unitario: 0 // Placeholder
                }))
            )
            if (itensError) throw itensError
        }

        // Handle 'fiado' payment date
        if (data.forma_pagamento === 'fiado' && data.data_prevista_pagamento) {
            const { error: pagError } = await supabase.from('pagamentos_venda').insert({
                venda_id: vendaData.id,
                valor: vendaData.total,
                data: data.data_prevista_pagamento,
                metodo: 'fiado',
            })
            if (pagError) throw pagError
        }

        // Fetch full object to return as Domain
        return this.getVendaById(vendaData.id)
    },

    async updateVenda(id: string, data: VendaFormData): Promise<DomainVenda> {
        // Update sale header
        const { error: vendaError } = await supabase
            .from('vendas')
            .update({
                contato_id: data.contato_id,
                data: data.data,
                total: data.itens.reduce((acc, item) => acc + item.subtotal, 0) + (data.taxa_entrega || 0),
                forma_pagamento: data.forma_pagamento,
                taxa_entrega: data.taxa_entrega || 0,
            })
            .eq('id', id)

        if (vendaError) throw vendaError

        // Delete existing items
        await supabase.from('itens_venda').delete().eq('venda_id', id)

        // Insert new items
        if (data.itens.length > 0) {
            const { error: itensError } = await supabase.from('itens_venda').insert(
                data.itens.map((item) => ({
                    venda_id: id,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: item.subtotal,
                    custo_unitario: 0,
                }))
            )
            if (itensError) throw itensError
        }

        // Fetch full object to return as Domain
        return this.getVendaById(id)
    },

    async updateVendaStatus(id: string, status: 'pendente' | 'entregue' | 'cancelada') {
        const { error } = await supabase
            .from('vendas')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return true
    },

    async updateVendaPago(id: string, pago: boolean) {
        const { error } = await supabase
            .from('vendas')
            .update({ pago })
            .eq('id', id)

        if (error) throw error
        return true
    },

    async deleteVenda(id: string) {
        const { error } = await supabase.from('vendas').delete().eq('id', id)
        if (error) throw error
        return true
    },

    async addPagamento(vendaId: string, data: PagamentoFormData) {
        // Map form data to database columns
        const { error } = await supabase.from('pagamentos_venda').insert({
            venda_id: vendaId,
            valor: data.valor,
            data: data.data,
            metodo: data.metodo,
            observacao: data.observacao,
        })

        if (error) throw error
        return true
    },

    calculateKPIs(vendas: DomainVenda[]): VendasMetrics {
        const totalVendas = vendas.length
        const faturamentoTotal = vendas.reduce((acc, v) => acc + v.total, 0)
        const faturamentoMes = faturamentoTotal // Logic matches filtered set
        const vendasMes = totalVendas

        const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0

        const produtosVendidos = vendas.reduce(
            (acc, v) => {
                v.itens?.forEach((item) => {
                    acc.total += item.quantidade
                    if (item.produto?.nome.includes('1kg')) acc.pote1kg += item.quantidade
                    if (item.produto?.nome.includes('4kg')) acc.pote4kg += item.quantidade
                })
                return acc
            },
            { total: 0, pote1kg: 0, pote4kg: 0 }
        )

        const recebido = vendas
            .filter((v) => v.pago)
            .reduce((acc, v) => acc + v.total, 0)

        const aReceber = vendas
            .filter((v) => !v.pago && v.status !== 'cancelada')
            .reduce((acc, v) => acc + v.total, 0)

        const entregasPendentes = vendas.filter((v) => v.status === 'pendente').length
        const entregasRealizadas = vendas.filter((v) => v.status === 'entregue').length

        // Simple profit calc (placeholder)
        const lucroMes = faturamentoMes * 0.3

        return {
            faturamentoTotal,
            faturamentoMes,
            totalVendas,
            vendasMes,
            ticketMedio,
            produtosVendidos,
            recebido,
            aReceber,
            entregasPendentes,
            entregasRealizadas,
            lucroMes,
        }
    }
}
