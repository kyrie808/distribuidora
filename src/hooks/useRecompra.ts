import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useConfiguracoes } from './useConfiguracoes'
import type { Contato } from '../types/database'
import { differenceInDays } from 'date-fns'

export type StatusRecompra = 'atrasado' | 'proximo' | 'ok'

export interface ContatoRecompra {
    contato: Contato
    diasSemCompra: number
    ciclo: number
    status: StatusRecompra
    ultimaCompra: Date | null
}

interface UseRecompraReturn {
    contatos: ContatoRecompra[]
    loading: boolean
    error: string | null
    atrasados: number
    proximos: number
    emDia: number
    refetch: () => Promise<void>
    marcarComoContatado: (contatoId: string) => Promise<boolean>
}

export function useRecompra(enabled: boolean = true): UseRecompraReturn {
    const { config, loading: loadingConfig } = useConfiguracoes()
    const [contatos, setContatos] = useState<ContatoRecompra[]>([])
    const [loading, setLoading] = useState(enabled)
    const [error, setError] = useState<string | null>(null)

    const fetchRecompra = useCallback(async () => {
        if (!enabled || loadingConfig) return

        setLoading(true)
        setError(null)

        try {
            const { data: clientesData, error: clientesError } = await supabase
                .from('contatos')
                .select('*')
                .eq('status', 'cliente')

            if (clientesError) throw clientesError
            const clientes = (clientesData ?? []) as Contato[]

            const { data: vendasData, error: vendasError } = await supabase
                .from('vendas')
                .select('contato_id, data')
                .eq('status', 'entregue')
                .order('data', { ascending: false })

            if (vendasError) throw vendasError

            const ultimaVendaPorContato = new Map<string, string>()
            vendasData?.forEach((v) => {
                if (!ultimaVendaPorContato.has(v.contato_id)) {
                    ultimaVendaPorContato.set(v.contato_id, v.data)
                }
            })

            const hoje = new Date()
            const contatosRecompra: ContatoRecompra[] = []

            clientes.forEach((cliente) => {
                const ciclo = cliente.tipo === 'B2B'
                    ? config.cicloRecompra.b2b
                    : config.cicloRecompra.b2c

                const ultimaVendaStr = ultimaVendaPorContato.get(cliente.id)
                const ultimaCompra = ultimaVendaStr ? new Date(ultimaVendaStr) : null
                const ultimoContato = cliente.ultimo_contato ? new Date(cliente.ultimo_contato) : null

                let dataReferencia: Date | null = null
                if (ultimaCompra && ultimoContato) {
                    dataReferencia = ultimaCompra > ultimoContato ? ultimaCompra : ultimoContato
                } else {
                    dataReferencia = ultimaCompra || ultimoContato
                }

                if (!dataReferencia) {
                    dataReferencia = new Date(cliente.criado_em)
                }

                const diasSemCompra = differenceInDays(hoje, dataReferencia)
                const thresholdProximo = cliente.tipo === 'B2B' ? 2 : 3

                let status: StatusRecompra
                if (diasSemCompra > ciclo) {
                    status = 'atrasado'
                } else if (diasSemCompra >= ciclo - thresholdProximo) {
                    status = 'proximo'
                } else {
                    status = 'ok'
                }

                contatosRecompra.push({
                    contato: cliente,
                    diasSemCompra,
                    ciclo,
                    status,
                    ultimaCompra,
                })
            })

            contatosRecompra.sort((a, b) => {
                const statusOrder = { atrasado: 0, proximo: 1, ok: 2 }
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status]
                }
                return b.diasSemCompra - a.diasSemCompra
            })

            setContatos(contatosRecompra)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar alertas')
        } finally {
            setLoading(false)
        }
    }, [config.cicloRecompra, loadingConfig, enabled])

    useEffect(() => {
        fetchRecompra()
    }, [fetchRecompra])

    const atrasados = useMemo(
        () => contatos.filter((c) => c.status === 'atrasado').length,
        [contatos]
    )

    const proximos = useMemo(
        () => contatos.filter((c) => c.status === 'proximo').length,
        [contatos]
    )

    const emDia = useMemo(
        () => contatos.filter((c) => c.status === 'ok').length,
        [contatos]
    )

    const marcarComoContatado = async (contatoId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('contatos')
                .update({ ultimo_contato: new Date().toISOString() })
                .eq('id', contatoId)

            if (error) throw error
            await fetchRecompra()
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao marcar como contatado')
            return false
        }
    }

    return {
        contatos,
        loading: loading || loadingConfig,
        error,
        atrasados,
        proximos,
        emDia,
        refetch: fetchRecompra,
        marcarComoContatado,
    }
}
