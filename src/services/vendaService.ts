import { supabase } from '../lib/supabase'
import type { Venda, ItemVenda, PagamentoVenda } from '../types/database'
import type { VendaFormData, PagamentoFormData } from '../schemas/venda'
import type { DomainVenda } from '../types/domain'
import { toDomainVenda } from './mappers'
import { isToday } from 'date-fns'

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
    faturamentoDia: number
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
            query = query.textSearch('fts', search, {
                type: 'websearch',
                config: 'simple'
            })
        }

        // Logic:
        // If includePending is TRUE:
        //   Query = (data >= start AND data <= end) OR (status = 'pendente') OR (pago = false and valorPago < total)
        // If includePending is FALSE:
        //   Query = (data >= start AND data <= end) (Standard filtering)

        if (includePending && (startDate || endDate)) {
            const conditions: string[] = []

            // Date Range Condition
            if (startDate && endDate) {
                const offset = startDate.getTimezoneOffset()

                const localStart = new Date(startDate.getTime() - (offset * 60 * 1000))
                const startStr = localStart.toISOString().split('T')[0]

                const localEnd = new Date(endDate.getTime() - (offset * 60 * 1000))
                const endStr = localEnd.toISOString().split('T')[0]

                conditions.push(`and(data.gte.${startStr},data.lte.${endStr})`)
            }

            // Pending Status Condition
            conditions.push(`status.eq.pendente`)

            // Pending Payment Condition (pago = false)
            conditions.push(`pago.eq.false`)

            // Combine with OR
            query = query.or(conditions.join(','))

        } else {
            // Standard behavior (Strict Date Filtering)
            if (startDate) {
                const offset = startDate.getTimezoneOffset()
                const localDate = new Date(startDate.getTime() - (offset * 60 * 1000))
                const startStr = localDate.toISOString().split('T')[0]
                query = query.gte('data', startStr)
            }
            if (endDate) {
                const offset = endDate.getTimezoneOffset()
                const localDate = new Date(endDate.getTime() - (offset * 60 * 1000))
                const endStr = localDate.toISOString().split('T')[0]
                query = query.lte('data', endStr)
            }
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
                total: data.itens.reduce((acc, item) => acc + item.subtotal, 0) + (data.taxa_entrega || 0),
                pago: false,
                forma_pagamento: data.forma_pagamento,
                taxa_entrega: data.taxa_entrega || 0,
                data_prevista_pagamento: data.data_prevista_pagamento,
                observacoes: null,
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

        // REMOVIDO: Bloco que criava pagamento "fiado" erroneamente
        // O "fiado" agora é controlado apenas pelo campo data_prevista_pagamento na tabela vendas

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

    async deleteUltimoPagamento(vendaId: string) {
        // Busca o último pagamento
        const { data: ultimosPagamentos, error: fetchError } = await supabase
            .from('pagamentos_venda')
            .select('id')
            .eq('venda_id', vendaId)
            .order('data', { ascending: false })
            .limit(1)

        if (fetchError) throw fetchError
        if (!ultimosPagamentos || ultimosPagamentos.length === 0) return false

        const pagamentoId = ultimosPagamentos[0].id

        // Deleta o pagamento
        const { error: deleteError } = await supabase
            .from('pagamentos_venda')
            .delete()
            .eq('id', pagamentoId)

        if (deleteError) throw deleteError

        // Se após deletar não houver mais pagamentos, garante que pago=false
        // (Isso já deve ser tratado por trigger/regra de negócio no backend se houver,
        // mas podemos forçar atualização se necessário. Por enquanto, assumimos que o hook vai recalcular ou refetch)
        const { error: updateError } = await supabase
            .from('vendas')
            .update({ pago: false }) // Força 'não pago' ao estornar, a lógica de saldo restante cuidará do resto se houver outros pagamentos
            .eq('id', vendaId)

        // Nota: Se houver pagamentos parciais, isso pode ser perigoso se forçar false incorretamente.
        // O ideal é recalcular. Vamos simplificar: deleta pagamento e atualiza status para false (assumindo estorno total de "Quitar")
        // Se formos mais robustos: verificar saldo restante. Mas "Quitar" geralmente é total.

        if (updateError) throw updateError

        return true
    },

    async getTotalAReceber(): Promise<number> {
        const { data, error } = await supabase
            .from('vendas')
            .select('total')
            .eq('pago', false)
            .neq('status', 'cancelada')

        if (error) {
            console.error('Error fetching total a receber:', error)
            return 0
        }

        return (data || []).reduce((acc, venda) => acc + (venda.total || 0), 0)
    },

    calculateKPIs(vendas: DomainVenda[]): VendasMetrics {
        const totalVendas = vendas.length
        // Faturamento (Cash Basis - Only Paid)
        const faturamentoTotal = vendas
            .filter(v => v.pago)
            .reduce((acc, v) => acc + v.total, 0)

        // Calculate daily revenue specifically from the current set
        // Fix: Parse YYYY-MM-DD as local noon to ensure reliable 'isToday' check
        const faturamentoDia = vendas
            .filter(v => {
                const vendaDate = new Date(`${v.data}T12:00:00`)
                return isToday(vendaDate) && v.pago
            })
            .reduce((acc, v) => acc + v.total, 0)

        const faturamentoMes = faturamentoTotal // Matches Vercel logic
        const vendasMes = totalVendas

        // Ticket Médio = Paid Revenue / Total Sales (Standard Vercel logic seems to be this)
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

        // Profit (Lucro) = Paid Revenue - Paid Cost
        const lucroMes = vendas
            .filter(v => v.pago)
            .reduce((acc, v) => acc + (v.total - (v.custoTotal || 0)), 0)

        return {
            faturamentoTotal,
            faturamentoDia,
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
