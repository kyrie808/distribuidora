import { supabase } from '../lib/supabase'
import type { VendaInsert, VendaUpdate, ItemVendaInsert } from '../types/database'
import type { DomainVenda, CreateVenda, UpdateVenda, VendasMetrics } from '../types/domain'
import { toDomainVenda } from './mappers'
import { isToday } from 'date-fns'


export const vendaService = {
    async getVendas(startDate?: Date, endDate?: Date, includePending = false, search?: string): Promise<DomainVenda[]> {
        let query = supabase
            .from('vendas')
            .select(`
                *,
                contato:contatos(id, nome, telefone, origem, indicado_por_id, status),
                itens:itens_venda(*, produto:produtos(id, nome, codigo)),
                pagamentos:pagamentos_venda(*)
            `)
            .order('criado_em', { ascending: false })

        if (search) {
            query = query.textSearch('fts', search, { type: 'websearch', config: 'simple' })
        }

        if (includePending && (startDate || endDate)) {
            const conditions: string[] = []
            if (startDate && endDate) {
                const startStr = startDate.toISOString().split('T')[0]
                const endStr = endDate.toISOString().split('T')[0]
                conditions.push(`and(data.gte.${startStr},data.lte.${endStr})`)
            }
            conditions.push(`status.eq.pendente`)
            conditions.push(`pago.eq.false`)
            query = query.or(conditions.join(','))
        } else {
            if (startDate) query = query.gte('data', startDate.toISOString().split('T')[0])
            if (endDate) query = query.lte('data', endDate.toISOString().split('T')[0])
        }

        const { data, error } = await query
        if (error) throw error

        return (data || []).map(v => toDomainVenda(v as any))
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
            .single()

        if (error) throw error
        return toDomainVenda(data as any)
    },

    async createVenda(data: CreateVenda): Promise<DomainVenda> {
        const vInsert: VendaInsert = {
            contato_id: data.contatoId,
            data: data.data,
            status: 'pendente',
            total: data.itens.reduce((acc, item) => acc + item.subtotal, 0) + (data.taxaEntrega || 0),
            pago: false,
            forma_pagamento: data.formaPagamento,
            taxa_entrega: data.taxaEntrega || 0,
            data_prevista_pagamento: data.dataPrevistaPagamento,
        }

        const { data: vendaData, error: vendaError } = await supabase.from('vendas').insert(vInsert).select().single()
        if (vendaError) throw vendaError

        if (data.itens.length > 0) {
            const iInserts: ItemVendaInsert[] = data.itens.map(it => ({
                venda_id: vendaData.id,
                produto_id: it.produtoId,
                quantidade: it.quantidade,
                preco_unitario: it.precoUnitario,
                subtotal: it.subtotal,
                custo_unitario: 0
            }))
            const { error: itensError } = await supabase.from('itens_venda').insert(iInserts)
            if (itensError) throw itensError
        }

        return this.getVendaById(vendaData.id)
    },

    async updateVenda(id: string, data: UpdateVenda): Promise<DomainVenda> {
        const vUpdate: VendaUpdate = {}
        if (data.contatoId) vUpdate.contato_id = data.contatoId
        if (data.data) vUpdate.data = data.data
        if (data.formaPagamento) vUpdate.forma_pagamento = data.formaPagamento
        if (data.taxaEntrega !== undefined) vUpdate.taxa_entrega = data.taxaEntrega
        if (data.status) vUpdate.status = data.status
        if (data.pago !== undefined) vUpdate.pago = data.pago

        const { error } = await supabase.from('vendas').update(vUpdate).eq('id', id)
        if (error) throw error

        return this.getVendaById(id)
    },

    async deleteVenda(id: string): Promise<boolean> {
        const { error } = await supabase.from('vendas').delete().eq('id', id)
        if (error) throw error
        return true
    },

    async addPagamento(vendaId: string, valor: number, metodo: string, data: string, observacao?: string): Promise<boolean> {
        const { error } = await supabase.from('pagamentos_venda').insert({
            venda_id: vendaId,
            valor,
            data,
            metodo,
            observacao
        })
        if (error) throw error
        return true
    },

    async getTotalAReceber(): Promise<number> {
        const { data, error } = await supabase.from('vendas').select('total').eq('pago', false).neq('status', 'cancelada')
        if (error) return 0
        return (data || []).reduce((acc, v) => acc + (v.total || 0), 0)
    },

    calculateKPIs(vendas: DomainVenda[]): VendasMetrics {
        const totalVendas = vendas.length
        const faturamentoTotal = vendas.filter(v => v.pago).reduce((acc, v) => acc + v.total, 0)
        const faturamentoDia = vendas.filter(v => isToday(new Date(v.data)) && v.pago).reduce((acc, v) => acc + v.total, 0)

        const produtosVendidos = vendas.reduce((acc, v) => {
            v.itens?.forEach(item => {
                acc.total += item.quantidade
                if (item.produto?.nome.includes('1kg')) acc.pote1kg += item.quantidade
                if (item.produto?.nome.includes('4kg')) acc.pote4kg += item.quantidade
            })
            return acc
        }, { total: 0, pote1kg: 0, pote4kg: 0 })

        return {
            faturamentoTotal,
            faturamentoDia,
            faturamentoMes: faturamentoTotal,
            totalVendas,
            vendasMes: totalVendas,
            ticketMedio: totalVendas > 0 ? faturamentoTotal / totalVendas : 0,
            produtosVendidos,
            recebido: faturamentoTotal,
            aReceber: vendas.filter(v => !v.pago && v.status !== 'cancelada').reduce((acc, v) => acc + v.total, 0),
            entregasPendentes: vendas.filter(v => v.status === 'pendente').length,
            entregasRealizadas: vendas.filter(v => v.status === 'entregue').length,
            lucroMes: vendas.filter(v => v.pago).reduce((acc, v) => acc + (v.total - (v.custoTotal || 0)), 0)
        }
    },

    async quitarVenda(id: string, valor: number, metodo: string, observacao?: string): Promise<DomainVenda> {
        const { error: vendaError } = await supabase
            .from('vendas')
            .update({ pago: true })
            .eq('id', id)

        if (vendaError) throw vendaError

        await this.addPagamento(id, valor, metodo, new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).split(' ')[0], observacao)

        return this.getVendaById(id)
    }
}
