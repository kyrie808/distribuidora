import { supabase } from '../lib/supabase'

export interface DashboardMetrics {
    operational: {
        total_vendas: number
        total_itens: number
        entregas_pendentes_total: number
        entregas_hoje_realizadas: number
        clientes_ativos: number
        ranking_indicacoes: any[]
        ultimas_vendas: any[]
    },
    financial: {
        faturamento_mes_atual: number
        lucro_mes_atual: number
        ticket_medio_mes_atual: number
        vendas_mes_atual: number
        faturamento_mes_anterior: number
        variacao_percentual: number
        total_a_receber: number
        liquidado_mes: number
        liquidado_mes_count: number
        alertas_financeiros: any[]
        a_receber_detalhado?: {
            vencidos: number
            vencem_hoje: number
            vencem_semana: number
            sem_data: number
            valor_vencido: number
            valor_hoje: number
            valor_semana: number
            valor_sem_data: number
        }
    },
    alertas_recompra: {
        contato_id: string
        nome: string
        telefone: string
        data_ultima_compra: string
        dias_sem_compra: number
    }[]
}

export const dashboardService = {
    async getDashboardMetrics(month: number, year: number): Promise<DashboardMetrics> {
        const [
            { data: financialData, error: finError },
            { data: operationalData, error: opError },
            { data: alertsData, error: alrError },
            { data: breakdownData, error: breakdownError }
        ] = await Promise.all([
            supabase
                .from('view_home_financeiro')
                .select('*')
                .eq('mes' as any, month)
                .eq('ano' as any, year)
                .maybeSingle(),
            supabase
                .from('view_home_operacional')
                .select('*')
                .eq('mes' as any, month)
                .eq('ano' as any, year)
                .maybeSingle(),
            supabase
                .from('view_home_alertas')
                .select('*')
                .limit(10),
            supabase.rpc('get_areceber_breakdown' as any).maybeSingle()
        ]) as any[]

        if (finError) throw finError
        if (opError) throw opError
        if (alrError) throw alrError
        if (breakdownError) throw breakdownError

        return mapDashboardMetrics(financialData, operationalData, alertsData, breakdownData)
    },

    async getLucroLiquido(mes: Date): Promise<{
        receita_bruta: number
        custo_produtos: number
        lucro_bruto: number
        despesas_operacionais: number
        custo_fabrica: number
        lucro_liquido: number
        margem_liquida_pct: number
    }> {
        const ano = mes.getFullYear()
        const mesNum = mes.getMonth() + 1
        const inicio = `${ano}-${String(mesNum).padStart(2, '0')}-01`
        const fimMes = new Date(ano, mesNum, 0).getDate()
        const fim = `${ano}-${String(mesNum).padStart(2, '0')}-${fimMes}`

        const { data, error } = await supabase
            .from('view_lucro_liquido_mensal' as any)
            .select('*')
            .gte('mes', inicio)
            .lte('mes', fim)
            .maybeSingle()

        if (error || !data) return {
            receita_bruta: 0, custo_produtos: 0, lucro_bruto: 0,
            despesas_operacionais: 0, custo_fabrica: 0,
            lucro_liquido: 0, margem_liquida_pct: 0
        }

        return {
            receita_bruta: Number((data as any).receita_bruta) || 0,
            custo_produtos: Number((data as any).custo_produtos) || 0,
            lucro_bruto: Number((data as any).lucro_bruto) || 0,
            despesas_operacionais: Number((data as any).despesas_operacionais) || 0,
            custo_fabrica: Number((data as any).custo_fabrica) || 0,
            lucro_liquido: Number((data as any).lucro_liquido) || 0,
            margem_liquida_pct: Number((data as any).margem_liquida_pct) || 0,
        }
    },

    async getLiquidadoMes(mes: Date): Promise<{
        vendas_liquidadas: number
        total_liquidado: number
    }> {
        const ano = mes.getFullYear()
        const mesNum = mes.getMonth() + 1
        const inicio = `${ano}-${String(mesNum).padStart(2, '0')}-01`
        const fimMes = new Date(ano, mesNum, 0).getDate()
        const fim = `${ano}-${String(mesNum).padStart(2, '0')}-${fimMes}`

        const { data, error } = await supabase
            .from('view_liquidado_mensal' as any)
            .select('*')
            .gte('mes', inicio)
            .lte('mes', fim)
            .maybeSingle()

        if (error || !data) return {
            vendas_liquidadas: 0,
            total_liquidado: 0
        }

        return {
            vendas_liquidadas: Number((data as any).vendas_liquidadas) || 0,
            total_liquidado: Number((data as any).total_liquidado) || 0
        }
    },

    async getTotalAReceber(): Promise<{
        total_a_receber: number
        total_vendas_abertas: number
    }> {
        const { data, error } = await supabase
            .from('vendas')
            .select('total')
            .eq('pago', false)
            .eq('status', 'entregue')
            .neq('forma_pagamento', 'brinde')
            .or('origem.is.null,origem.neq.catalogo')

        if (error || !data) return {
            total_a_receber: 0,
            total_vendas_abertas: 0
        }

        return {
            total_a_receber: data.reduce((acc, v) =>
                acc + Number(v.total), 0),
            total_vendas_abertas: data.length
        }
    }
}

// Pure business logic extracted for testing
export function mapDashboardMetrics(financialData: any, operationalData: any, alertsData: any, breakdownData?: any): DashboardMetrics {
    const fin = financialData || {
        faturamento: 0,
        ticket_medio: 0,
        lucro_estimado: 0,
        total_a_receber: 0,
        liquidado_mes: 0,
        liquidado_mes_count: 0,
        faturamento_anterior: 0,
        variacao_faturamento_percentual: 0,
        alertas_financeiros: []
    }

    const op = operationalData || {
        total_vendas: 0,
        total_itens: 0,
        pedidos_pendentes: 0,
        pedidos_entregues_hoje: 0,
        clientes_ativos: 0,
        ranking_indicacoes: [],
        ultimas_vendas: []
    }

    return {
        operational: {
            total_vendas: op.total_vendas ?? 0,
            total_itens: op.total_itens ?? 0,
            entregas_pendentes_total: op.pedidos_pendentes ?? 0,
            entregas_hoje_realizadas: op.pedidos_entregues_hoje ?? 0,
            clientes_ativos: op.clientes_ativos ?? 0,
            ranking_indicacoes: (op.ranking_indicacoes as any[]) ?? [],
            ultimas_vendas: (op.ultimas_vendas as any[]) ?? [],
        },
        financial: {
            faturamento_mes_atual: fin.faturamento ?? 0,
            lucro_mes_atual: fin.lucro_estimado ?? 0,
            ticket_medio_mes_atual: fin.ticket_medio ?? 0,
            vendas_mes_atual: op.total_vendas ?? 0,
            faturamento_mes_anterior: fin.faturamento_anterior ?? 0,
            variacao_percentual: fin.variacao_faturamento_percentual ?? 0,
            total_a_receber: fin.total_a_receber ?? 0,
            liquidado_mes: fin.liquidado_mes ?? 0,
            liquidado_mes_count: fin.liquidado_mes_count ?? 0,
            alertas_financeiros: (fin.alertas_financeiros as any[]) ?? [],
            a_receber_detalhado: breakdownData ? {
                vencidos: Number(breakdownData.vencidos || 0),
                vencem_hoje: Number(breakdownData.vencem_hoje || 0),
                vencem_semana: Number(breakdownData.vencem_semana || 0),
                sem_data: Number(breakdownData.sem_data || 0),
                valor_vencido: Number(breakdownData.valor_vencido || 0),
                valor_hoje: Number(breakdownData.valor_hoje || 0),
                valor_semana: Number(breakdownData.valor_semana || 0),
                valor_sem_data: Number(breakdownData.valor_sem_data || 0),
            } : undefined
        },
        alertas_recompra: (alertsData || []).map((a: any) => ({
            contato_id: a.contato_id ?? '',
            nome: a.nome ?? 'Cliente sem nome',
            telefone: a.telefone ?? '',
            data_ultima_compra: a.data_ultima_compra ?? '',
            dias_sem_compra: a.dias_sem_compra ?? 0
        }))
    }
}
