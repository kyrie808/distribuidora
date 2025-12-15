import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Produto, ProdutoInsert, ProdutoUpdate } from '../types/database'

interface UseProdutosOptions {
    includeInactive?: boolean
}

interface UseProdutosReturn {
    produtos: Produto[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getProdutoById: (id: string) => Produto | undefined
    createProduto: (data: ProdutoInsert) => Promise<Produto | null>
    updateProduto: (id: string, data: ProdutoUpdate) => Promise<Produto | null>
    updateEstoque: (id: string, quantidade: number) => Promise<Produto | null>
}

export function useProdutos(options: UseProdutosOptions = {}): UseProdutosReturn {
    const { includeInactive = false } = options
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProdutos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('produtos')
                .select('*')
                .order('nome')

            if (!includeInactive) {
                query = query.eq('ativo', true)
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError
            setProdutos((data as Produto[]) ?? [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        } finally {
            setLoading(false)
        }
    }, [includeInactive])

    useEffect(() => {
        fetchProdutos()
    }, [fetchProdutos])

    const getProdutoById = useCallback(
        (id: string) => produtos.find((p) => p.id === id),
        [produtos]
    )

    const createProduto = async (data: ProdutoInsert): Promise<Produto | null> => {
        try {
            const { data: newProduto, error } = await supabase
                .from('produtos')
                .insert(data)
                .select()
                .single()

            if (error) throw error

            // Refresh list
            await fetchProdutos()
            return newProduto as Produto
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar produto')
            return null
        }
    }

    const updateProduto = async (id: string, data: ProdutoUpdate): Promise<Produto | null> => {
        try {
            const { data: updatedProduto, error } = await supabase
                .from('produtos')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            // Refresh list
            await fetchProdutos()
            return updatedProduto as Produto
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar produto')
            return null
        }
    }

    const updateEstoque = async (id: string, quantidade: number): Promise<Produto | null> => {
        try {
            const { data: updatedProduto, error } = await supabase
                .from('produtos')
                .update({ estoque_atual: quantidade })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            // Optimistic update: Update local state instead of full refetch
            setProdutos(prevProdutos =>
                prevProdutos.map(p =>
                    p.id === id ? { ...p, estoque_atual: quantidade } : p
                )
            )

            return updatedProduto as Produto
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar estoque')
            return null
        }
    }

    return {
        produtos,
        loading,
        error,
        refetch: fetchProdutos,
        getProdutoById,
        createProduto,
        updateProduto,
        updateEstoque,
    }
}
