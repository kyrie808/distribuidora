import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { startOfDay, endOfDay } from 'date-fns'

interface LogisticsMetrics {
    entregasPendentesTotal: number
    entregasRealizadasHoje: number
    entregasRealizadasTotal: number /* Optional context */
    taxaEntregaHoje: number
}

interface UseLogisticaReturn {
    metrics: LogisticsMetrics
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useLogistica(): UseLogisticaReturn {
    const [metrics, setMetrics] = useState<LogisticsMetrics>({
        entregasPendentesTotal: 0,
        entregasRealizadasHoje: 0,
        entregasRealizadasTotal: 0,
        taxaEntregaHoje: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLogistics = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Fetch ALL pending deliveries (Global Backlog)
            const { count: pendingCount, error: pendingError } = await supabase
                .from('vendas')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pendente')
                .neq('status', 'cancelada')

            if (pendingError) throw pendingError

            // 2. Fetch deliveries completed TODAY
            const hoje = new Date()
            const startStr = startOfDay(hoje).toISOString()
            const endStr = endOfDay(hoje).toISOString()

            const { count: doneTodayCount, error: doneError } = await supabase
                .from('vendas')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'entregue')
                .gte('data', startStr) // Assuming 'data' is the delivery date context, or use 'updated_at' if tracking precise status change time
                .lte('data', endStr)

            if (doneError) throw doneError

            // Calculate "Daily Route" completion rate
            // Concept: Daily Work = Done Today + Pending (Backlog available to do)
            // This is an operational approximation. If pending is too large, this rate drops.
            // A better operational metric might be "Assigned Today", but for now:
            const totalWorkload = (doneTodayCount || 0) + (pendingCount || 0)
            const rate = totalWorkload > 0 ? ((doneTodayCount || 0) / totalWorkload) * 100 : 0

            setMetrics({
                entregasPendentesTotal: pendingCount || 0,
                entregasRealizadasHoje: doneTodayCount || 0,
                entregasRealizadasTotal: 0, // Not querying global done count to save resources
                taxaEntregaHoje: Math.round(rate)
            })

        } catch (err) {
            console.error('Erro ao buscar logística:', err)
            setError('Falha ao carregar dados logísticos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogistics()
    }, [fetchLogistics])

    // Realtime subscription for logistics updates
    useEffect(() => {
        const channel = supabase
            .channel('logistica-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vendas' },
                () => fetchLogistics()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchLogistics])

    return { metrics, loading, error, refetch: fetchLogistics }
}
