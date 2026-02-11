import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    const queryClient = useQueryClient()
    const queryKey = ['produtos', includeInactive]

    // Main Query
    const { data: produtos, isLoading: loading, error, refetch } = useQuery({
        queryKey,
        queryFn: () => produtoService.getAll(includeInactive),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: produtoService.create.bind(produtoService),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<DomainProduto> }) =>
            produtoService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const updateEstoqueMutation = useMutation({
        mutationFn: ({ id, quantidade }: { id: string, quantidade: number }) =>
            produtoService.updateEstoque(id, quantidade),
        // Optimistic Update
        onMutate: async ({ id, quantidade }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['produtos'] })

            // Snapshot the previous value
            const previousProdutos = queryClient.getQueryData<DomainProduto[]>(['produtos'])

            // Optimistically update to the new value
            if (previousProdutos) {
                queryClient.setQueryData<DomainProduto[]>(['produtos'], old =>
                    old ? old.map(p => p.id === id ? { ...p, estoqueAtual: quantidade } : p) : []
                )
            }

            return { previousProdutos }
        },
        onError: (_err, _newTodo, context) => {
            // Rollback on error
            if (context?.previousProdutos) {
                queryClient.setQueryData(['produtos'], context.previousProdutos)
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })


    // Wrapper functions to maintain API compatibility
    const getProdutoById = useCallback((id: string) => {
        return produtos?.find((p) => p.id === id)
    }, [produtos])

    const createProduto = useCallback(async (data: ProdutoInsert) => {
        try {
            return await createMutation.mutateAsync(data)
        } catch (e) {
            console.error(e)
            return null
        }
    }, [createMutation])

    const updateProduto = useCallback(async (id: string, data: Partial<DomainProduto>) => {
        try {
            return await updateMutation.mutateAsync({ id, data })
        } catch (e) {
            console.error(e)
            return null
        }
    }, [updateMutation])

    const updateEstoque = useCallback(async (id: string, quantidade: number) => {
        try {
            return await updateEstoqueMutation.mutateAsync({ id, quantidade })
        } catch (e) {
            console.error(e)
            return null
        }
    }, [updateEstoqueMutation])


    return {
        produtos: produtos || [],
        loading,
        error: error ? (error as Error).message : null,
        refetch: async () => { await refetch() },
        getProdutoById,
        createProduto,
        updateProduto,
        updateEstoque,
    }
}
