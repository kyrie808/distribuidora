import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Venda, VendaInsert, ItemVenda, ItemVendaInsert, PagamentoVenda } from '../types/database'
import type { VendaFiltros, VendaFormData, PagamentoFormData } from '../schemas/venda'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export interface VendaComItens extends Venda {
    itens: (ItemVenda & {
        produto?: {
            id: string
            nome: string
            codigo: string
        }
    })[]
    contato?: {
        id: string
        nome: string
        telefone: string
        origem: string
        indicado_por_id?: string | null
        indicador?: {
            id: string
            nome: string
        } | null
    }
    pagamentos?: PagamentoVenda[]
}

interface VendasMetrics {
    faturamentoTotal: number
    faturamentoMes: number
    totalVendas: number
    vendasMes: number
    ticketMedio: number
    produtosVendidos: {
        total: number
        pote1kg: number
        pote4kg: number
    }
    // Pagamento
    recebido: number
    aReceber: number
    // Entregas
    entregasPendentes: number
    entregasRealizadas: number
    lucroMes: number
}

interface UseVendasOptions {
    filtros?: VendaFiltros
    realtime?: boolean
    startDate?: Date
    endDate?: Date
}

interface UseVendasReturn {
    vendas: VendaComItens[]
    loading: boolean
    error: string | null
    metrics: VendasMetrics
    refetch: () => Promise<void>
    createVenda: (data: VendaFormData) => Promise<Venda | null>
    updateVendaStatus: (id: string, status: 'pendente' | 'entregue' | 'cancelada') => Promise<boolean>
    updateVendaPago: (id: string, pago: boolean) => Promise<boolean>
    deleteVenda: (id: string) => Promise<boolean>
    updateVenda: (id: string, data: VendaFormData) => Promise<Venda | null>
    getVendaById: (id: string) => Promise<VendaComItens | null>
    addPagamento: (data: PagamentoFormData) => Promise<boolean>
}

export function useVendas(options: UseVendasOptions = {}): UseVendasReturn {
    const { filtros, realtime = true, startDate, endDate } = options
    const [vendas, setVendas] = useState<VendaComItens[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Apply date filters
    const getDateRange = useCallback((periodo: string) => {
        const now = new Date()
        switch (periodo) {
            case 'hoje':
                return { start: startOfDay(now), end: endOfDay(now) }
            case 'semana':
                return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) }
            case 'mes':
                return { start: startOfMonth(now), end: endOfMonth(now) }
            default:
                return null
        }
    }, [])

    // Fetch vendas with filters
    const fetchVendas = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Construct select clause based on whether we need to filter by contact
            // If searching by contact name, we need an inner join (contatos!inner)
            const contactRelation = filtros?.search ? 'contatos!inner' : 'contatos'

            let query = supabase
                .from('vendas')
                .select(`
          *,
          contato:${contactRelation}(id, nome, telefone, origem, indicado_por_id),
          itens:itens_venda(*, produto:produtos(id, nome, codigo))
        `)
                .order('criado_em', { ascending: false })

            // Apply filters
            if (filtros?.status && filtros.status !== 'todos') {
                query = query.eq('status', filtros.status)
            }
            if (filtros?.forma_pagamento && filtros.forma_pagamento !== 'todos') {
                query = query.eq('forma_pagamento', filtros.forma_pagamento)
            }

            // Date filtering priority: Explicit Range > Period Filter
            if (startDate && endDate) {
                query = query
                    .gte('data', startDate.toISOString().split('T')[0])
                    .lte('data', endDate.toISOString().split('T')[0])
            } else if (filtros?.periodo && filtros.periodo !== 'todos') {
                const dateRange = getDateRange(filtros.periodo)
                if (dateRange) {
                    query = query
                        .gte('data', dateRange.start.toISOString().split('T')[0])
                        .lte('data', dateRange.end.toISOString().split('T')[0])
                }
            }

            if (filtros?.contatoId) {
                query = query.eq('contato_id', filtros.contatoId)
            }

            if (filtros?.search) {
                // !inner forces an inner join to filter sales by contact properties
                query = query.ilike('contatos.nome', `%${filtros.search}%`)
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError

            // Transform data to match VendaComItens type
            const transformed = (data ?? []).map((v) => ({
                ...v,
                contato: Array.isArray(v.contato) ? v.contato[0] : v.contato,
                itens: v.itens ?? [],
            })) as VendaComItens[]

            setVendas(transformed)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar vendas')
        } finally {
            setLoading(false)
        }
    }, [filtros?.status, filtros?.forma_pagamento, filtros?.periodo, filtros?.search, getDateRange, startDate, endDate])

    // Setup realtime subscription
    useEffect(() => {
        fetchVendas()

        if (!realtime) return

        const channel = supabase
            .channel('vendas-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'vendas',
                },
                () => {
                    // Refetch on any change to get complete data with relations
                    fetchVendas()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchVendas, realtime])

    // Fetched vendas are ALREADY filtered by date range from the query.
    // So we don't need to filter by month/year again here for the main metrics.
    // However, for consistency if no filter was applied (e.g. all history), we might want to be careful.
    // But per our plan, we are now driving this by the global filter.
    // Let's assume 'vendas' contains exactly what we want to analyze.
    const metrics: VendasMetrics = (() => {
        const vendasNaoCanceladas = vendas.filter((v) => v.status !== 'cancelada')

        // Faturamento (Net of delivery fee)
        const faturamentoTotal = vendasNaoCanceladas.reduce((acc, v) =>
            acc + (v.pago && v.forma_pagamento !== 'brinde' ? (Number(v.total) - (v.taxa_entrega || 0)) : 0), 0)

        // For "faturamentoMes", since the list is already filtered by the selected period, it is the same as total.
        const faturamentoMes = faturamentoTotal

        // Product metrics
        const produtosVendidos = vendasNaoCanceladas.reduce((acc, v) => {
            v.itens.forEach(item => {
                acc.total += item.quantidade
                if (item.produto?.codigo === 'pao_queijo_1kg') {
                    acc.pote1kg += item.quantidade
                } else if (item.produto?.codigo === 'pao_queijo_4kg') {
                    acc.pote4kg += item.quantidade
                }
            })
            return acc
        }, { total: 0, pote1kg: 0, pote4kg: 0 })

        // Payment metrics (Net of delivery fee)
        const recebido = vendasNaoCanceladas
            .filter(v => v.pago === true && v.forma_pagamento !== 'brinde')
            .reduce((acc, v) => acc + (Number(v.total) - (v.taxa_entrega || 0)), 0)

        const aReceber = vendasNaoCanceladas
            .filter(v => v.pago !== true && v.forma_pagamento !== 'brinde')
            .reduce((acc, v) => acc + (Number(v.total) - (v.taxa_entrega || 0)), 0)

        // Profit metric
        const lucroMes = vendasNaoCanceladas.reduce((acc, v) => {
            if (v.pago && v.forma_pagamento !== 'brinde') {
                return acc + ((Number(v.total) - (v.taxa_entrega || 0)) - (v.custo_total || 0))
            }
            return acc
        }, 0)

        // Delivery metrics
        const entregasPendentes = vendas.filter(v => v.status === 'pendente').length
        const entregasRealizadas = vendas.filter(v => v.status === 'entregue').length

        return {
            faturamentoTotal,
            faturamentoMes,
            lucroMes,
            totalVendas: vendasNaoCanceladas.length,
            vendasMes: vendasNaoCanceladas.length, // Same as totalVendas in this filtered context
            ticketMedio: vendasNaoCanceladas.length > 0 ? faturamentoTotal / vendasNaoCanceladas.length : 0,
            produtosVendidos,
            recebido,
            aReceber,
            entregasPendentes,
            entregasRealizadas,
        }
    })()

    // Create venda with items and update contact status
    const createVenda = async (data: VendaFormData): Promise<Venda | null> => {
        try {
            // Fetch product costs first
            const { data: produtos } = await supabase
                .from('produtos')
                .select('id, custo')
                .in('id', data.itens.map(i => i.produto_id))

            const produtoMap = new Map(produtos?.map(p => [p.id, p]))

            // Calculate costs
            const custoTotal = data.itens.reduce((acc, item) => {
                const custoItem = produtoMap.get(item.produto_id)?.custo || 0
                return acc + (custoItem * item.quantidade)
            }, 0)

            // Calculate total
            const total = data.itens.reduce((acc, item) => acc + item.subtotal, 0)

            // Insert venda
            const vendaInsert: VendaInsert = {
                contato_id: data.contato_id,
                data: data.data,
                data_entrega: data.data_entrega || null,
                total: total + (data.taxa_entrega || 0),
                taxa_entrega: data.taxa_entrega || 0,
                forma_pagamento: data.forma_pagamento,
                status: 'pendente',
                pago: ['pix', 'dinheiro', 'cartao'].includes(data.forma_pagamento),
                observacoes: data.observacoes || null,
                custo_total: custoTotal,
                // Mapeamento de campos adicionais refatorado
                parcelas: data.parcelas || null,
                data_prevista_pagamento: data.data_prevista_pagamento || null,
            }

            const { data: newVenda, error: vendaError } = await supabase
                .from('vendas')
                .insert(vendaInsert)
                .select()
                .single()

            if (vendaError) throw vendaError

            const typedVenda = newVenda as Venda

            // Financial Mirroring: Auto-create payment if paid at sale creation
            // This ensures data consistency between Sales and Financial modules
            if (vendaInsert.pago) {
                const { error: pgtoError } = await supabase
                    .from('pagamentos_venda')
                    .insert({
                        venda_id: typedVenda.id,
                        valor: typedVenda.total,
                        metodo: data.forma_pagamento,
                        data: new Date().toISOString(),
                        observacao: 'Pagamento automático na criação da venda'
                    })

                if (pgtoError) {
                    console.error('Erro ao registrar pagamento automático:', pgtoError)
                    throw new Error(`Erro ao registrar pagamento automático: ${pgtoError.message}`)
                }
            }

            // Insert items
            const itensInsert: ItemVendaInsert[] = data.itens.map((item) => ({
                venda_id: typedVenda.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
                custo_unitario: produtoMap.get(item.produto_id)?.custo || 0,
            }))

            const { error: itensError } = await supabase
                .from('itens_venda')
                .insert(itensInsert)

            if (itensError) throw itensError

            // Update contact status to 'cliente' and ultimo_contato
            await supabase
                .from('contatos')
                .update({
                    status: 'cliente',
                    ultimo_contato: new Date().toISOString()
                })
                .eq('id', data.contato_id)

            // Update stock (decrement) for each item
            for (const item of data.itens) {
                // Get current stock
                const { data: prodData, error: prodError } = await supabase
                    .from('produtos')
                    .select('estoque_atual')
                    .eq('id', item.produto_id)
                    .single()

                if (prodError) throw prodError

                // Decrement stock
                const { error: updateError } = await supabase
                    .from('produtos')
                    .update({ estoque_atual: (prodData.estoque_atual || 0) - item.quantidade })
                    .eq('id', item.produto_id)

                if (updateError) throw updateError
            }

            return typedVenda
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar venda')
            return null
        }
    }

    // Update venda status
    const updateVendaStatus = async (
        id: string,
        status: 'pendente' | 'entregue' | 'cancelada'
    ): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('vendas')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
            return false
        }
    }

    // Update Venda completa com gestão de estoque
    const updateVenda = async (id: string, data: VendaFormData): Promise<Venda | null> => {
        try {
            // 1. Recuperar itens antigos para devolver ao estoque
            const { data: oldItems, error: oldItemsError } = await supabase
                .from('itens_venda')
                .select('produto_id, quantidade')
                .eq('venda_id', id)

            if (oldItemsError) throw oldItemsError

            // 2. Devolver estoque dos itens antigos
            for (const item of oldItems || []) {
                // Buscar estoque atual
                const { data: prodData, error: prodError } = await supabase
                    .from('produtos')
                    .select('estoque_atual')
                    .eq('id', item.produto_id)
                    .single()

                if (prodError) throw prodError

                // Atualizar com incremento
                const { error: updateError } = await supabase
                    .from('produtos')
                    .update({ estoque_atual: (prodData.estoque_atual || 0) + item.quantidade })
                    .eq('id', item.produto_id)

                if (updateError) throw updateError
            }

            // Fetch product costs for NEW items
            const { data: produtos } = await supabase
                .from('produtos')
                .select('id, custo')
                .in('id', data.itens.map(i => i.produto_id))

            const produtoMap = new Map(produtos?.map(p => [p.id, p]))

            // Calculate costs
            const custoTotal = data.itens.reduce((acc, item) => {
                const custoItem = produtoMap.get(item.produto_id)?.custo || 0
                return acc + (custoItem * item.quantidade)
            }, 0)

            // 3. Atualizar dados da venda
            const total = data.itens.reduce((acc, item) => acc + item.subtotal, 0)
            const { data: vendaUpdated, error: vendaError } = await supabase
                .from('vendas')
                .update({
                    contato_id: data.contato_id,
                    data: data.data,
                    data_entrega: data.data_entrega || null,
                    total: total + (data.taxa_entrega || 0),
                    taxa_entrega: data.taxa_entrega || 0,
                    forma_pagamento: data.forma_pagamento,
                    observacoes: data.observacoes || null,
                    custo_total: custoTotal,
                })
                .eq('id', id)
                .select()
                .single()

            if (vendaError) throw vendaError

            // 4. Limpar itens antigos (Delete)
            const { error: deleteError } = await supabase
                .from('itens_venda')
                .delete()
                .eq('venda_id', id)

            if (deleteError) throw deleteError

            // 5. Inserir novos itens
            const itensInsert: ItemVendaInsert[] = data.itens.map((item) => ({
                venda_id: id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
                custo_unitario: produtoMap.get(item.produto_id)?.custo || 0,
            }))

            const { error: insertError } = await supabase
                .from('itens_venda')
                .insert(itensInsert)

            if (insertError) throw insertError

            // 6. Baixar novo estoque
            for (const item of data.itens) {
                // Buscar estoque atual
                const { data: prodData, error: prodError } = await supabase
                    .from('produtos')
                    .select('estoque_atual')
                    .eq('id', item.produto_id)
                    .single()

                if (prodError) throw prodError

                // Atualizar com decremento
                const { error: updateError } = await supabase
                    .from('produtos')
                    .update({ estoque_atual: (prodData.estoque_atual || 0) - item.quantidade })
                    .eq('id', item.produto_id)

                if (updateError) throw updateError
            }

            return vendaUpdated as Venda
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar venda')
            return null
        }
    }

    // Update venda pago status
    const updateVendaPago = async (id: string, pago: boolean): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('vendas')
                .update({ pago })
                .eq('id', id)

            if (error) throw error
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar pagamento')
            return false
        }
    }

    // Delete venda
    const deleteVenda = async (id: string): Promise<boolean> => {
        try {
            // 1. Get items to restore stock
            const { data: items, error: itemsError } = await supabase
                .from('itens_venda')
                .select('produto_id, quantidade')
                .eq('venda_id', id)

            if (itemsError) throw itemsError

            // 2. Restore stock (increment)
            for (const item of items || []) {
                // Get current stock
                const { data: prodData, error: prodError } = await supabase
                    .from('produtos')
                    .select('estoque_atual')
                    .eq('id', item.produto_id)
                    .single()

                if (prodError) throw prodError

                // Increment stock
                const { error: updateError } = await supabase
                    .from('produtos')
                    .update({ estoque_atual: (prodData.estoque_atual || 0) + item.quantidade })
                    .eq('id', item.produto_id)

                if (updateError) throw updateError
            }

            // 3. Delete items first (cascade should handle but being explicit)
            await supabase.from('itens_venda').delete().eq('venda_id', id)

            // 4. Delete sale
            const { error } = await supabase.from('vendas').delete().eq('id', id)
            if (error) throw error

            setVendas(prev => prev.filter(v => v.id !== id))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir venda')
            return false
        }
    }

    // Get single venda by ID with items
    const getVendaById = async (id: string): Promise<VendaComItens | null> => {
        try {
            const { data, error } = await supabase
                .from('vendas')
                .select(`
          *,
          contato:contatos(id, nome, telefone),
          itens:itens_venda(*, produto:produtos(*)),
          pagamentos:pagamentos_venda(*)
        `)
                .eq('id', id)
                .order('data', { foreignTable: 'pagamentos_venda', ascending: false })
                .single()

            if (error) throw error

            const vendaData = data as unknown as VendaComItens
            return {
                ...vendaData,
                contato: Array.isArray(vendaData.contato) ? vendaData.contato[0] : vendaData.contato,
                itens: vendaData.itens ?? [],
                pagamentos: vendaData.pagamentos ?? []
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao buscar venda')
            return null
        }
    }

    // Registrar pagamento
    const addPagamento = async (data: PagamentoFormData): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('pagamentos_venda')
                .insert({
                    venda_id: data.venda_id,
                    valor: data.valor,
                    metodo: data.metodo,
                    observacao: data.observacao,
                    data: data.data
                })

            if (error) throw error
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento')
            return false
        }
    }

    return {
        vendas,
        loading,
        error,
        metrics,
        refetch: fetchVendas,
        createVenda,
        updateVendaStatus,
        updateVendaPago,
        updateVenda,
        deleteVenda,
        getVendaById,
        addPagamento,
    }
}

// Hook for single venda detail
export function useVenda(id: string | undefined) {
    const [venda, setVenda] = useState<VendaComItens | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchVenda = useCallback(async () => {
        if (!id) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data, error: queryError } = await supabase
                .from('vendas')
                .select(`
            *,
            contato:contatos(id, nome, telefone, tipo, status),
            itens:itens_venda(*, produto:produtos(id, nome, codigo, preco, unidade)),
            pagamentos:pagamentos_venda(*)
          `)
                .eq('id', id)
                .order('data', { foreignTable: 'pagamentos_venda', ascending: false })
                .single()

            if (queryError) throw queryError

            const vendaData = data as unknown as VendaComItens
            setVenda({
                ...vendaData,
                contato: Array.isArray(vendaData.contato) ? vendaData.contato[0] : vendaData.contato,
                itens: vendaData.itens ?? [],
                pagamentos: vendaData.pagamentos ?? []
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar venda')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchVenda()
    }, [fetchVenda])

    return { venda, loading, error, refetch: fetchVenda }
}
