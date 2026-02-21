import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contatoService } from '../services/contatoService'
import type { DomainContato } from '../types/domain'
import type { TablesInsert } from '../types/database'
import type { ContatoFiltros } from '../schemas/contato'

type ContatoInsert = TablesInsert<'contatos'>

// Export types used by components
export type { DomainContato }

interface UseContatosOptions {
    filtros?: ContatoFiltros
    realtime?: boolean // Kept for compatibility
}

interface UseContatosReturn {
    contatos: DomainContato[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    createContato: (data: ContatoInsert) => Promise<DomainContato | null>
    updateContato: (id: string, data: Partial<DomainContato>) => Promise<DomainContato | null>
    deleteContato: (id: string) => Promise<{ success: boolean; error?: string }>
    getContatoById: (id: string) => Promise<DomainContato | null>
    searchContatos: (query: string) => Promise<DomainContato[]>
    getNomeIndicador: (contato: DomainContato) => string | null
}

export function useContatos(options: UseContatosOptions = {}): UseContatosReturn {
    const { filtros } = options
    const queryClient = useQueryClient()
    const queryKey = ['contatos', filtros]

    // Main Query
    const { data: contatos, isLoading: loading, error, refetch } = useQuery({
        queryKey,
        queryFn: () => contatoService.func(
            filtros?.busca,
            filtros?.tipo,
            filtros?.status
        ),
        staleTime: 1000 * 60 * 15, // 15 minutes (Contacts don't change often)
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: ContatoInsert) => contatoService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contatos'] })
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DomainContato> }) =>
            contatoService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contatos'] })
            queryClient.invalidateQueries({ queryKey: ['venda'] }) // Might affect sales details
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => contatoService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contatos'] })
        }
    })


    // Actions
    const createContato = useCallback(async (data: ContatoInsert) => {
        try {
            return await createMutation.mutateAsync(data)
        } catch (e) {
            console.error(e)
            return null
        }
    }, [createMutation])

    const updateContato = useCallback(async (id: string, data: Partial<DomainContato>) => {
        try {
            return await updateMutation.mutateAsync({ id, data })
        } catch (e) {
            console.error(e)
            return null
        }
    }, [updateMutation])

    const deleteContato = useCallback(async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id)
            return { success: true }
        } catch (e: any) {
            console.error('Erro ao deletar contato:', e)
            return {
                success: false,
                error: e?.message?.includes('violates foreign key constraint')
                    ? 'Este contato possui vendas ou pedidos vinculados e não pode ser excluído.'
                    : (e as Error).message
            }
        }
    }, [deleteMutation])


    const getContatoById = useCallback(async (id: string) => {
        return contatoService.getById(id)
    }, [])

    const searchContatos = useCallback(async (query: string) => {
        try {
            return await contatoService.func(query)
        } catch (err) {
            console.error('Erro na busca:', err)
            return []
        }
    }, [])

    const getNomeIndicador = (contato: DomainContato): string | null => {
        return contato.indicador?.nome || null
    }

    return {
        contatos: contatos || [],
        loading,
        error: error ? (error as Error).message : null,
        refetch: async () => { await refetch() },
        createContato,
        updateContato,
        deleteContato,
        getContatoById,
        searchContatos,
        getNomeIndicador
    }
}

export function useContato(id: string | undefined) {
    const { data: contato, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['contato', id],
        queryFn: () => id ? contatoService.getById(id) : null,
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })

    return {
        contato: contato || null,
        indicador: contato?.indicador,
        loading,
        error: error ? (error as Error).message : null,
        refetch: async () => { await refetch() }
    }
}
