import { useQuery } from '@tanstack/react-query'
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
        alertas_financeiros: any[]
    },
    alertas_recompra: {
        contato_id: string
        nome: string
        telefone: string
        data_ultima_compra: string
        dias_sem_compra: number
    }[]
}

export function useDashboardMetrics(month?: number, year?: number) {
    const targetMonth = month || new Date().getMonth() + 1
    const targetYear = year || new Date().getFullYear()

    return useQuery({
        queryKey: ['dashboard_metrics', targetMonth, targetYear],
        queryFn: async (): Promise<DashboardMetrics> => {
            const [
                { data: financialData, error: finError },
                { data: operationalData, error: opError },
                { data: alertsData, error: alrError }
            ] = await Promise.all([
                supabase
                    .from('view_home_financeiro')
                    .select('*')
                    .eq('mes', targetMonth)
                    .eq('ano', targetYear)
                    .maybeSingle(),
                supabase
                    .from('view_home_operacional')
                    .select('*')
                    .eq('mes', targetMonth)
                    .eq('ano', targetYear)
                    .maybeSingle(),
                supabase
                    .from('view_home_alertas')
                    .select('*')
                    .limit(10)
            ])

            if (finError) throw finError
            if (opError) throw opError
            if (alrError) throw alrError

            const fin = financialData || {
                faturamento: 0,
                ticket_medio: 0,
                lucro_estimado: 0,
                total_a_receber: 0,
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
                    alertas_financeiros: (fin.alertas_financeiros as any[]) ?? []
                },
                alertas_recompra: (alertsData || []).map(a => ({
                    contato_id: a.contato_id ?? '',
                    nome: a.nome ?? 'Cliente sem nome',
                    telefone: a.telefone ?? '',
                    data_ultima_compra: a.data_ultima_compra ?? '',
                    dias_sem_compra: a.dias_sem_compra ?? 0
                }))
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    })
}
