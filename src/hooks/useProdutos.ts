import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Produto } from '../types/database'

interface UseProdutosReturn {
    produtos: Produto[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getProdutoById: (id: string) => Produto | undefined
}

export function useProdutos(): UseProdutosReturn {
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProdutos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: queryError } = await supabase
                .from('produtos')
                .select('*')
                .eq('ativo', true)
                .order('nome')

            if (queryError) throw queryError
            setProdutos((data as Produto[]) ?? [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProdutos()
    }, [fetchProdutos])

    const getProdutoById = useCallback(
        (id: string) => produtos.find((p) => p.id === id),
        [produtos]
    )

    return {
        produtos,
        loading,
        error,
        refetch: fetchProdutos,
        getProdutoById,
    }
}
