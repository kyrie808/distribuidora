import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'


export interface IndicadorStats {
    indicadorId: string
    nome: string
    totalIndicados: number
    totalVendasIndicados: number
    ranking: number
}

interface UseTopIndicadoresReturn {
    topIndicadores: IndicadorStats[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useTopIndicadores(): UseTopIndicadoresReturn {
    const [topIndicadores, setTopIndicadores] = useState<IndicadorStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTopIndicadores = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // 1. Fetch all clients who have an indicator
            const { data: indicados, error: indicadosError } = await supabase
                .from('contatos')
                .select('id, indicado_por_id, nome')
                .not('indicado_por_id', 'is', null)

            if (indicadosError) throw indicadosError

            // 2. Fetch sales for these clients to calculate value generated
            // This might be heavy, so we might optimistically limit or just count volume
            // For now, let's just count number of indications to keep it fast, 
            // or fetch aggregated sales if possible. 
            // Let's stick to simple "Number of Active Clients Referred" for now as it's cleaner.

            // Map to count indications
            const counts = new Map<string, number>()
            indicados?.forEach((indicado) => {
                const indicadorId = indicado.indicado_por_id

                // Note: indicados is an array of objects.
                // We need to fetch the NAMES of the indicators.
                // The contact who IS the indicator is also in 'contatos' table.

                if (indicadorId) {
                    counts.set(indicadorId, (counts.get(indicadorId) || 0) + 1)
                }
            })

            if (counts.size === 0) {
                setTopIndicadores([])
                return
            }

            // 3. Fetch details of the indicators themselves
            const indicadorIds = Array.from(counts.keys())
            const { data: indicadoresDetails, error: detailsError } = await supabase
                .from('contatos')
                .select('id, nome')
                .in('id,', indicadorIds) // Fix: removed extra comma in string if any
                .in('id', indicadorIds)

            if (detailsError) throw detailsError

            // 4. Construct the stats array
            const stats: IndicadorStats[] = indicadoresDetails?.map(indicador => ({
                indicadorId: indicador.id,
                nome: indicador.nome,
                totalIndicados: counts.get(indicador.id) || 0,
                totalVendasIndicados: 0, // Placeholder for future expansion
                ranking: 0 // Will assign after sort
            })) || []

            // Sort by totalIndicados desc
            stats.sort((a, b) => b.totalIndicados - a.totalIndicados)

            // Assign ranking
            stats.forEach((stat, index) => {
                stat.ranking = index + 1
            })

            setTopIndicadores(stats.slice(0, 5)) // Top 5
        } catch (err) {
            console.error(err)
            setError('Erro ao carregar top indicadores')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTopIndicadores()
    }, [fetchTopIndicadores])

    return {
        topIndicadores,
        loading,
        error,
        refetch: fetchTopIndicadores
    }
}
