import { supabase } from '../lib/supabase'
import type { Conta, PlanoConta, Lancamento, ExtratoItem, FluxoResumo, Insert } from '../types/database'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export const cashFlowService = {
    // --- Contas ---
    async getContas() {
        const { data, error } = await supabase
            .from('contas')
            .select('*')
            .order('nome')
        if (error) throw error
        return data as Conta[]
    },

    async createConta(data: Insert<'contas'>) {
        const { data: created, error } = await supabase
            .from('contas')
            .insert(data)
            .select()
            .single()
        if (error) throw error
        return created as Conta
    },

    // --- Plano de Contas ---
    async getPlanoDeContas() {
        const { data, error } = await supabase
            .from('plano_de_contas')
            .select('*')
            .order('nome')
        if (error) throw error
        return data as PlanoConta[]
    },

    async createPlanoConta(data: Insert<'plano_de_contas'>) {
        const { data: created, error } = await supabase
            .from('plano_de_contas')
            .insert(data)
            .select()
            .single()
        if (error) throw error
        return created as PlanoConta
    },

    // --- Lancamentos ---
    async createLancamento(data: Insert<'lancamentos'>) {
        const { data: created, error } = await supabase
            .from('lancamentos')
            .insert({
                ...data,
                origem: data.origem || 'manual'
            } as Insert<'lancamentos'>)
            .select()
            .single()
        if (error) throw error
        return created as Lancamento
    },

    async createTransferencia(data: {
        valor: number
        data: string
        conta_id: string
        conta_destino_id: string
        descricao?: string
    }) {
        // Transferência é um lançamento do tipo 'transferencia'
        // O sistema deve tratar a saída da conta_id e entrada na conta_destino_id
        // Isso pode ser feito no banco (trigger) ou aqui.
        // Pelo schema, temos conta_id e conta_destino_id no mesmo registro.
        const { data: created, error } = await supabase
            .from('lancamentos')
            .insert({
                tipo: 'transferencia',
                valor: data.valor,
                data: data.data,
                conta_id: data.conta_id,
                conta_destino_id: data.conta_destino_id,
                descricao: data.descricao || 'Transferência entre contas',
                origem: 'manual'
            })
            .select()
            .single()
        if (error) throw error
        return created as Lancamento
    },

    // --- RPC: Marcar Venda como Paga ---
    async marcarVendaPaga(vendaId: string, contaId: string, dataPagamento?: string) {
        const { error } = await supabase.rpc('rpc_marcar_venda_paga', {
            p_venda_id: vendaId,
            p_conta_id: contaId,
            p_data: dataPagamento || format(new Date(), 'yyyy-MM-dd')
        })
        if (error) throw error
        return true
    },

    // --- Views / Reports ---
    async getExtratoMensal(month: Date) {
        const start = format(startOfMonth(month), 'yyyy-MM-dd')
        const end = format(endOfMonth(month), 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('view_extrato_mensal')
            .select('*')
            .gte('data', start)
            .lte('data', end)
            .order('data', { ascending: false })

        if (error) throw error
        return data as ExtratoItem[]
    },

    async getFluxoResumo(month: Date) {
        const mes = month.getMonth() + 1
        const ano = month.getFullYear()

        const { data, error } = await supabase
            .from('view_fluxo_resumo')
            .select('*')
            .eq('mes', mes)
            .eq('ano', ano)
            .maybeSingle()

        if (error) throw error
        return data as FluxoResumo
    },

    async getContasReceber() {
        // Vendas entregues mas não pagas
        const { data, error } = await supabase
            .from('vendas')
            .select(`
        *,
        contato:contatos(nome)
      `)
            .eq('status', 'entregue')
            .eq('pago', false)
            .order('data_prevista_pagamento', { ascending: true })

        if (error) throw error
        return data
    }
}
