import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cashFlowService } from '../services/cashFlowService'
import type { Database } from '../types/database'

type LancamentoInsert = Database['public']['Tables']['lancamentos']['Insert']

export function useLancamentos() {
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: (data: LancamentoInsert) => cashFlowService.createLancamento(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['extrato'] })
            queryClient.invalidateQueries({ queryKey: ['fluxo_resumo'] })
            queryClient.invalidateQueries({ queryKey: ['contas'] })
        },
    })

    const createTransferenciaMutation = useMutation({
        mutationFn: (data: {
            valor: number
            data: string
            conta_id: string
            conta_destino_id: string
            descricao?: string
        }) => cashFlowService.createTransferencia(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['extrato'] })
            queryClient.invalidateQueries({ queryKey: ['fluxo_resumo'] })
            queryClient.invalidateQueries({ queryKey: ['contas'] })
        },
    })

    const marcarVendaPagaMutation = useMutation({
        mutationFn: ({ vendaId, contaId, dataPagamento }: { vendaId: string, contaId: string, dataPagamento?: string }) =>
            cashFlowService.marcarVendaPaga(vendaId, contaId, dataPagamento),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['contas_receber'] })
            queryClient.invalidateQueries({ queryKey: ['extrato'] })
            queryClient.invalidateQueries({ queryKey: ['fluxo_resumo'] })
            queryClient.invalidateQueries({ queryKey: ['contas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
        },
    })

    const createLancamento = useCallback(async (data: LancamentoInsert) => {
        return createMutation.mutateAsync(data)
    }, [createMutation])

    const createTransferencia = useCallback(async (data: {
        valor: number
        data: string
        conta_id: string
        conta_destino_id: string
        descricao?: string
    }) => {
        return createTransferenciaMutation.mutateAsync(data)
    }, [createTransferenciaMutation])

    const marcarVendaPaga = useCallback(async (params: { vendaId: string, contaId: string, dataPagamento?: string }) => {
        return marcarVendaPagaMutation.mutateAsync(params)
    }, [marcarVendaPagaMutation])

    return {
        createLancamento,
        isCreating: createMutation.isPending,
        createTransferencia,
        isTransferring: createTransferenciaMutation.isPending,
        marcarVendaPaga,
        isMarkingPaid: marcarVendaPagaMutation.isPending,
    }
}
