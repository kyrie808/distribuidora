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
            const { data, error: fetchError } = await supabase
                .from('ranking_indicacoes')
                .select('*')
                .order('total_indicados', { ascending: false })
                .limit(10)

            if (fetchError) throw fetchError

            const stats: IndicadorStats[] = data.map((item, index) => ({
                indicadorId: item.indicador_id as string,
                nome: item.nome as string,
                totalIndicados: item.total_indicados || 0,
                totalVendasIndicados: item.total_vendas_indicados || 0,
                ranking: index + 1
            }))

            setTopIndicadores(stats)
        } catch (err) {
            console.error(err)
            setError('Erro ao carregar ranking de indicações')
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
