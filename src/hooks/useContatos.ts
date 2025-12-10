import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Contato, ContatoInsert, ContatoUpdate } from '../types/database'
import type { ContatoFiltros } from '../schemas/contato'

interface UseContatosOptions {
    filtros?: ContatoFiltros
    realtime?: boolean
}

interface UseContatosReturn {
    contatos: Contato[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    createContato: (data: ContatoInsert) => Promise<Contato | null>
    updateContato: (id: string, data: ContatoUpdate) => Promise<Contato | null>
    deleteContato: (id: string) => Promise<boolean>
    getContatoById: (id: string) => Promise<Contato | null>
    searchContatos: (query: string) => Promise<Contato[]>
}

export function useContatos(options: UseContatosOptions = {}): UseContatosReturn {
    const { filtros, realtime = true } = options
    const [contatos, setContatos] = useState<Contato[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch contatos with filters
    const fetchContatos = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('contatos')
                .select('*')
                .order('criado_em', { ascending: false })

            // Apply filters
            if (filtros?.busca) {
                query = query.or(`nome.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`)
            }
            if (filtros?.tipo && filtros.tipo !== 'todos') {
                query = query.eq('tipo', filtros.tipo)
            }
            if (filtros?.status && filtros.status !== 'todos') {
                query = query.eq('status', filtros.status)
            }
            if (filtros?.origem && filtros.origem !== 'todos') {
                query = query.eq('origem', filtros.origem)
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError
            setContatos(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar contatos')
        } finally {
            setLoading(false)
        }
    }, [filtros?.busca, filtros?.tipo, filtros?.status, filtros?.origem])

    // Setup realtime subscription
    useEffect(() => {
        fetchContatos()

        if (!realtime) return

        const channel = supabase
            .channel('contatos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contatos',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setContatos((prev) => [payload.new as Contato, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        setContatos((prev) =>
                            prev.map((c) =>
                                c.id === (payload.new as Contato).id ? (payload.new as Contato) : c
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setContatos((prev) =>
                            prev.filter((c) => c.id !== (payload.old as Contato).id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchContatos, realtime])

    // Create contato
    const createContato = async (data: ContatoInsert): Promise<Contato | null> => {
        try {
            const { data: newContato, error } = await supabase
                .from('contatos')
                .insert(data)
                .select()
                .single()

            if (error) throw error
            return newContato
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar contato')
            return null
        }
    }

    // Update contato
    const updateContato = async (
        id: string,
        data: ContatoUpdate
    ): Promise<Contato | null> => {
        try {
            const { data: updatedContato, error } = await supabase
                .from('contatos')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return updatedContato
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar contato')
            return null
        }
    }

    // Delete contato
    const deleteContato = async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('contatos').delete().eq('id', id)

            if (error) throw error
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar contato')
            return false
        }
    }

    // Get single contato by ID
    const getContatoById = async (id: string): Promise<Contato | null> => {
        try {
            const { data, error } = await supabase
                .from('contatos')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao buscar contato')
            return null
        }
    }

    // Search contatos (for autocomplete)
    const searchContatos = async (query: string): Promise<Contato[]> => {
        if (!query || query.length < 2) return []

        try {
            const { data, error } = await supabase
                .from('contatos')
                .select('*')
                .or(`nome.ilike.%${query}%,telefone.ilike.%${query}%`)
                .limit(10)

            if (error) throw error
            return data || []
        } catch (err) {
            return []
        }
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
    }
}

// Hook for single contato detail
export function useContato(id: string | undefined) {
    const [contato, setContato] = useState<Contato | null>(null)
    const [indicador, setIndicador] = useState<Contato | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }

        const fetchContato = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch contato
                const { data, error: queryError } = await supabase
                    .from('contatos')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (queryError) throw queryError
                setContato(data)

                // Fetch indicador if exists
                if (data?.indicado_por_id) {
                    const { data: indicadorData } = await supabase
                        .from('contatos')
                        .select('*')
                        .eq('id', data.indicado_por_id)
                        .single()

                    setIndicador(indicadorData)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar contato')
            } finally {
                setLoading(false)
            }
        }

        fetchContato()

        // Setup realtime for this specific contato
        const channel = supabase
            .channel(`contato-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'contatos',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setContato(payload.new as Contato)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    return { contato, indicador, loading, error }
}
