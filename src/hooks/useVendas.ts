import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { vendaService, type VendasMetrics, type VendaComItens } from '../services/vendaService'
import type { VendaFormData, PagamentoFormData } from '../schemas/venda'
import type { DomainVenda } from '../types/domain'

export type { VendaComItens }

interface UseVendasOptions {
    realtime?: boolean
    startDate?: Date
    endDate?: Date
    includePending?: boolean
    search?: string
    enabled?: boolean
}

interface UseVendasReturn {
    vendas: DomainVenda[]
    loading: boolean
    error: string | null
    metrics: VendasMetrics
    refetch: () => Promise<void>
    createVenda: (data: VendaFormData) => Promise<DomainVenda | null>
    updateVendaStatus: (id: string, status: 'pendente' | 'entregue' | 'cancelada') => Promise<boolean>
    updateVendaPago: (id: string, pago: boolean) => Promise<boolean>
    deleteVenda: (id: string) => Promise<boolean>
    updateVenda: (id: string, data: VendaFormData) => Promise<DomainVenda | null>
    getVendaById: (id: string) => Promise<DomainVenda | null>
    addPagamento: (vendaId: string, data: PagamentoFormData) => Promise<boolean>
    deleteUltimoPagamento: (vendaId: string) => Promise<boolean>
}

export function useVendas({ startDate, endDate, includePending = false, search, enabled = true }: UseVendasOptions = {}): UseVendasReturn {
    const queryClient = useQueryClient()
    const queryKey = ['vendas', startDate?.toISOString(), endDate?.toISOString(), includePending, search]

    const { data, isLoading, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            const [vendasData, totalAReceber] = await Promise.all([
                vendaService.getVendas(startDate, endDate, includePending, search),
                vendaService.getTotalAReceber()
            ])

            const calculatedMetrics = vendaService.calculateKPIs(vendasData)

            return {
                vendas: vendasData,
                metrics: {
                    ...calculatedMetrics,
                    aReceber: totalAReceber
                }
            }
        },
        enabled,
        staleTime: 1000 * 60 * 5,
    })

    const createVendaMutation = useMutation({
        mutationFn: (data: VendaFormData) => vendaService.createVenda(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const updateVendaMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: VendaFormData }) => vendaService.updateVenda(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'pendente' | 'entregue' | 'cancelada' }) =>
            vendaService.updateVendaStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const updatePagoMutation = useMutation({
        mutationFn: ({ id, pago }: { id: string; pago: boolean }) =>
            vendaService.updateVendaPago(id, pago),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const deleteVendaMutation = useMutation({
        mutationFn: (id: string) => vendaService.deleteVenda(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const addPagamentoMutation = useMutation({
        mutationFn: async ({ vendaId, data }: { vendaId: string; data: PagamentoFormData }) => {
            const result = await vendaService.addPagamento(vendaId, data)
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const deletePagamentoMutation = useMutation({
        mutationFn: (vendaId: string) => vendaService.deleteUltimoPagamento(vendaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] })
            queryClient.invalidateQueries({ queryKey: ['produtos'] })
        }
    })

    const metrics = data?.metrics || {
        faturamentoTotal: 0,
        faturamentoDia: 0,
        faturamentoMes: 0,
        totalVendas: 0,
        vendasMes: 0,
        ticketMedio: 0,
        produtosVendidos: { total: 0, pote1kg: 0, pote4kg: 0 },
        recebido: 0,
        aReceber: 0,
        entregasPendentes: 0,
        entregasRealizadas: 0,
        lucroMes: 0,
    }

    const createVenda = useCallback(async (formData: VendaFormData) => {
        try {
            return await createVendaMutation.mutateAsync(formData)
        } catch (e) { console.error(e); return null }
    }, [createVendaMutation])

    const updateVenda = useCallback(async (id: string, formData: VendaFormData) => {
        try {
            return await updateVendaMutation.mutateAsync({ id, data: formData })
        } catch (e) { console.error(e); return null }
    }, [updateVendaMutation])

    const updateVendaStatus = useCallback(async (id: string, status: 'pendente' | 'entregue' | 'cancelada') => {
        try {
            await updateStatusMutation.mutateAsync({ id, status })
            return true
        } catch (e) { console.error(e); return false }
    }, [updateStatusMutation])

    const updateVendaPago = useCallback(async (id: string, pago: boolean) => {
        try {
            await updatePagoMutation.mutateAsync({ id, pago })
            return true
        } catch (e) { console.error(e); return false }
    }, [updatePagoMutation])

    const deleteVenda = useCallback(async (id: string) => {
        try {
            await deleteVendaMutation.mutateAsync(id)
            return true
        } catch (e) { console.error(e); return false }
    }, [deleteVendaMutation])

    const addPagamento = useCallback(async (vendaId: string, formData: PagamentoFormData) => {
        try {
            await addPagamentoMutation.mutateAsync({ vendaId, data: formData })
            return true
        } catch (e) { console.error(e); return false }
    }, [addPagamentoMutation])

    const deleteUltimoPagamento = useCallback(async (vendaId: string) => {
        try {
            await deletePagamentoMutation.mutateAsync(vendaId)
            return true
        } catch (e) { console.error(e); return false }
    }, [deletePagamentoMutation])

    const getVendaById = useCallback(async (id: string) => {
        return vendaService.getVendaById(id)
    }, [])

    return {
        vendas: data?.vendas || [],
        loading: isLoading,
        error: error ? (error as Error).message : null,
        metrics,
        refetch: async () => { await refetch() },
        createVenda,
        updateVenda,
        updateVendaStatus,
        updateVendaPago,
        deleteVenda,
        getVendaById,
        addPagamento,
        deleteUltimoPagamento
    }
}

export function useVenda(id: string | undefined) {
    const { data: venda, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['venda', id],
        queryFn: () => id ? vendaService.getVendaById(id) : null,
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })

    return {
        venda: venda || null,
        loading,
        error: error ? (error as Error).message : null,
        refetch: async () => { await refetch() }
    }
}
