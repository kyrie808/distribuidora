import { useEffect, useState, useCallback } from 'react'
import { produtoService } from '../services/produtoService'
import type { DomainProduto } from '../types/domain'
import type { ProdutoInsert } from '../types/database'

// Export types used by components
export type { DomainProduto }

interface UseProdutosOptions {
    includeInactive?: boolean
}

interface UseProdutosReturn {
    produtos: DomainProduto[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getProdutoById: (id: string) => DomainProduto | undefined
    createProduto: (data: ProdutoInsert) => Promise<DomainProduto | null>
    updateProduto: (id: string, data: Partial<DomainProduto>) => Promise<DomainProduto | null>
    updateEstoque: (id: string, quantidade: number) => Promise<DomainProduto | null>
}

export function useProdutos(options: UseProdutosOptions = {}): UseProdutosReturn {
    const { includeInactive = false } = options
    const [produtos, setProdutos] = useState<DomainProduto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProdutos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await produtoService.getAll(includeInactive)
            setProdutos(data)
        } catch (err) {
            console.error('Erro ao carregar produtos:', err)
            setError('Erro ao carregar produtos')
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

    const createProduto = async (data: ProdutoInsert): Promise<DomainProduto | null> => {
        try {
            const newProduto = await produtoService.create(data)
            // No need to full refetch if we just append, but safer to refetch to ensure order
            await fetchProdutos()
            return newProduto
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar produto')
            return null
        }
    }

    const updateProduto = async (id: string, data: Partial<DomainProduto>): Promise<DomainProduto | null> => {
        try {
            const updated = await produtoService.update(id, data)
            // Optimistic update for UI responsiveness
            setProdutos(prev => prev.map(p => p.id === id ? updated : p))
            return updated
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar produto')
            await fetchProdutos() // Revert on error
            return null
        }
    }

    const updateEstoque = async (id: string, quantidade: number): Promise<DomainProduto | null> => {
        // Snapshot for rollback
        const previousProdutos = [...produtos]

        try {
            // Optimistic update: atualiza estado local imediatamente
            setProdutos(prevProdutos =>
                prevProdutos.map(p =>
                    p.id === id ? { ...p, estoqueAtual: quantidade } : p
                )
            )

            const updated = await produtoService.updateEstoque(id, quantidade)
            // Confirm update with server data
            setProdutos(prev => prev.map(p => p.id === id ? updated : p))

            return updated
        } catch (err) {
            console.error('Erro no updateEstoque:', err)
            setError('Erro ao atualizar estoque')
            // Rollback
            setProdutos(previousProdutos)
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
