import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { startOfDay, differenceInDays, isBefore, isSameDay, addDays } from 'date-fns'
import type { VendaComItens } from './useVendas'

export type StatusFinanceiro = 'atrasado' | 'hoje' | 'proximo'

export interface AlertaFinanceiro {
    venda: VendaComItens
    diasAtraso: number
    status: StatusFinanceiro
    dataPrevista: Date
}

interface UseAlertasFinanceirosReturn {
    alertas: AlertaFinanceiro[]
    loading: boolean
    error: string | null
    totalAtrasado: number
    totalHoje: number
    totalProximo: number
    refetch: () => Promise<void>
}

export function useAlertasFinanceiros(): UseAlertasFinanceirosReturn {
    const [alertas, setAlertas] = useState<AlertaFinanceiro[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAlertas = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Buscando vendas pendentes do tipo fiado
            const { data, error: queryError } = await supabase
                .from('vendas')
                .select(`
                    *,
                    contato:contatos(id, nome, telefone, origem, indicado_por_id),
                    itens:itens_venda(*, produto:produtos(id, nome, codigo))
                `)
                .eq('pago', false)
                .eq('forma_pagamento', 'fiado')
                .neq('status', 'cancelada')
                .order('data_prevista_pagamento', { ascending: true })

            if (queryError) throw queryError

            const vendas = (data ?? []) as unknown as VendaComItens[]

            const hoje = startOfDay(new Date())
            const limiteProximo = addDays(hoje, 3)

            const alertasProcessados: AlertaFinanceiro[] = []

            vendas.forEach(venda => {
                if (!venda.data_prevista_pagamento) return

                // Ajustando timezone para garantir comparação correta de datas
                // Assumindo que a data do banco vem como YYYY-MM-DD ou ISO
                const dataPrevista = startOfDay(new Date(venda.data_prevista_pagamento))

                let status: StatusFinanceiro | null = null

                if (isBefore(dataPrevista, hoje)) {
                    status = 'atrasado'
                } else if (isSameDay(dataPrevista, hoje)) {
                    status = 'hoje'
                } else if (isBefore(dataPrevista, limiteProximo) || isSameDay(dataPrevista, limiteProximo)) {
                    status = 'proximo'
                }

                if (status) {
                    alertasProcessados.push({
                        venda: {
                            ...venda,
                            // Normalizing contact array if needed (though supabase types usually handle single relation correctly if configured, safe to cast or check)
                            contato: Array.isArray(venda.contato) ? venda.contato[0] : venda.contato,
                        },
                        diasAtraso: differenceInDays(hoje, dataPrevista),
                        status,
                        dataPrevista
                    })
                }
            })

            setAlertas(alertasProcessados)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar alertas financeiros')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAlertas()
    }, [fetchAlertas])

    const totalAtrasado = useMemo(() =>
        alertas.filter(a => a.status === 'atrasado').reduce((acc, curr) => acc + curr.venda.total, 0),
        [alertas])

    const totalHoje = useMemo(() =>
        alertas.filter(a => a.status === 'hoje').reduce((acc, curr) => acc + curr.venda.total, 0),
        [alertas])

    const totalProximo = useMemo(() =>
        alertas.filter(a => a.status === 'proximo').reduce((acc, curr) => acc + curr.venda.total, 0),
        [alertas])

    return {
        alertas,
        loading,
        error,
        totalAtrasado,
        totalHoje,
        totalProximo,
        refetch: fetchAlertas
    }
}
