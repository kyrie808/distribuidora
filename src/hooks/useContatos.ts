import { useEffect, useState, useCallback } from 'react'
import { contatoService } from '../services/contatoService'
import type { DomainContato } from '../types/domain'
import type { ContatoInsert } from '../types/database'
import type { ContatoFiltros } from '../schemas/contato'

// Export types used by components
export type { DomainContato }

interface UseContatosOptions {
    filtros?: ContatoFiltros
    realtime?: boolean
}

interface UseContatosReturn {
    contatos: DomainContato[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    createContato: (data: ContatoInsert) => Promise<DomainContato | null>
    updateContato: (id: string, data: Partial<DomainContato>) => Promise<DomainContato | null>
    deleteContato: (id: string) => Promise<boolean>
    getContatoById: (id: string) => Promise<DomainContato | null>
    searchContatos: (query: string) => Promise<DomainContato[]>
    getNomeIndicador: (contato: DomainContato) => string | null
}

export function useContatos(options: UseContatosOptions = {}): UseContatosReturn {
    const { filtros } = options // Removed realtime temporarily as we moved to Service pattern without subscription yet
    const [contatos, setContatos] = useState<DomainContato[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch contatos with filters
    const fetchContatos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await contatoService.func(
                filtros?.busca,
                filtros?.tipo,
                filtros?.status
            )
            setContatos(data)
        } catch (err) {
            console.error('Erro ao carregar contatos:', err)
            setError('Erro ao carregar contatos')
        } finally {
            setLoading(false)
        }
    }, [filtros?.busca, filtros?.tipo, filtros?.status])

    // Initial fetch
    useEffect(() => {
        fetchContatos()
    }, [fetchContatos])

    const getContatoById = async (id: string): Promise<DomainContato | null> => {
        try {
            return await contatoService.getById(id)
        } catch (err) {
            setError('Erro ao buscar contato')
            return null
        }
    }

    const searchContatos = async (query: string): Promise<DomainContato[]> => {
        try {
            return await contatoService.func(query)
        } catch (err) {
            console.error('Erro na busca:', err)
            return []
        }
    }

    const createContato = async (data: ContatoInsert): Promise<DomainContato | null> => {
        try {
            const newContato = await contatoService.create(data)
            await fetchContatos()
            return newContato
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar contato')
            return null
        }
    }

    const updateContato = async (id: string, data: Partial<DomainContato>): Promise<DomainContato | null> => {
        try {
            const updated = await contatoService.update(id, data)
            await fetchContatos()
            return updated
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar contato')
            return null
        }
    }

    const deleteContato = async (id: string): Promise<boolean> => {
        try {
            await contatoService.delete(id)
            setContatos(prev => prev.filter(c => c.id !== id))
            return true
        } catch (err) {
            setError('Erro ao deletar contato')
            return false
        }
    }

    const getNomeIndicador = (contato: DomainContato): string | null => {
        return contato.indicador?.nome || null
    }

    return {
        contatos,
        loading,
        error,
        refetch: fetchContatos,
        createContato,
        updateContato,
        deleteContato,
        getContatoById,
        searchContatos,
        getNomeIndicador
    }
}

export function useContato(id: string | undefined) {
    const [contato, setContato] = useState<DomainContato | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchContato = useCallback(async () => {
        if (!id) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)

        try {
            const data = await contatoService.getById(id)
            setContato(data)
        } catch (err) {
            console.error('Erro ao carregar contato:', err)
            setError('Erro ao carregar contato')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchContato()
    }, [fetchContato])

    return {
        contato,
        indicador: contato?.indicador,
        loading,
        error,
        refetch: fetchContato
    }
}
