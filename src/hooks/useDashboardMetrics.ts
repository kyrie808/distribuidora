import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DashboardMetrics {
    operational: {
        total_a_receber: number
        entregas_pendentes_total: number
        entregas_hoje_pendentes: number
        entregas_hoje_realizadas: number
        clientes_ativos: number
    }
    financial: {
        faturamento_mes_atual: number
        lucro_mes_atual: number
        ticket_medio_mes_atual: number
        vendas_mes_atual: number
        faturamento_mes_anterior: number
    }
}

export function useDashboardMetrics(month?: number, year?: number) {
    const targetMonth = month || new Date().getMonth() + 1
    const targetYear = year || new Date().getFullYear()

    return useQuery({
        queryKey: ['dashboard_metrics', targetMonth, targetYear],
        queryFn: async (): Promise<DashboardMetrics> => {
            // Calculate Previous Month logic
            const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1
            const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear

            // Fetch Operational Snapshot (This is usually a current snapshot, so filter might not apply if view is realtime, 
            // BUT user asked to fix Month/Year filter. Operational snapshot typically implies "NOW", 
            // but if the view supports history we would filter. 
            // Looking at the view definition: It has subqueries on 'vendas'. 
            // If the view doesn't have date columns, we can't filter it by date.
            // The view 'crm_view_operational_snapshot' aggregates *current* state (pending deliveries, active clients).
            // It doesn't seem to support historical browsing. 
            // However, the prompt focuses on 'crm_view_monthly_sales' for the filtering.
            // We will keep operational snapshot as is (current state) or ideally it should also be filtered if possible, 
            // but based on view definition it's a snapshot.
            // Let's focus on Financials which come from 'crm_view_monthly_sales'.

            const { data: operationalData, error: opError } = await supabase
                .from('crm_view_operational_snapshot')
                .select('*')
                .single()

            if (opError) throw opError

            // Fetch Monthly Sales (Target & Previous)
            // We need to fetch both possibly across different years if Jan is selected
            const { data: salesData, error: salesError } = await supabase
                .from('crm_view_monthly_sales')
                .select('*')
                .or(`and(mes.eq.${targetMonth},ano.eq.${targetYear}),and(mes.eq.${previousMonth},ano.eq.${previousYear})`)

            if (salesError) throw salesError

            const currentMonthData = salesData?.find(d => d.mes === targetMonth && d.ano === targetYear)
            const previousMonthData = salesData?.find(d => d.mes === previousMonth && d.ano === previousYear)

            return {
                operational: {
                    total_a_receber: operationalData.total_a_receber ?? 0,
                    entregas_pendentes_total: operationalData.entregas_pendentes_total ?? 0,
                    entregas_hoje_pendentes: operationalData.entregas_hoje_pendentes ?? 0,
                    entregas_hoje_realizadas: operationalData.entregas_hoje_realizadas ?? 0,
                    clientes_ativos: operationalData.clientes_ativos ?? 0,
                },
                financial: {
                    faturamento_mes_atual: currentMonthData?.faturamento ?? 0,
                    lucro_mes_atual: currentMonthData?.lucro ?? 0,
                    ticket_medio_mes_atual: currentMonthData?.ticket_medio ?? 0,
                    vendas_mes_atual: currentMonthData?.total_vendas ?? 0,
                    faturamento_mes_anterior: previousMonthData?.faturamento ?? 0,
                }
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    })
}
