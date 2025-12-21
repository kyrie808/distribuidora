import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Venda, VendaInsert, ItemVenda, ItemVendaInsert } from '../types/database'
import type { VendaFiltros, VendaFormData } from '../schemas/venda'
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
}

interface UseVendasOptions {
    filtros?: VendaFiltros
    realtime?: boolean
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
}

export function useVendas(options: UseVendasOptions = {}): UseVendasReturn {
    const { filtros, realtime = true } = options
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
            if (filtros?.periodo && filtros.periodo !== 'todos') {
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
                // We need to modify the select to ensure the join works for filtering
                // The original select already has contact:contatos(...) which is a left join by default
                // But specifically for filtering we rely on the PostgREST syntax 
                // However, basic supabase syntax for filtering on foreign tables often requires !inner in the select string
                // Let's modify the select string dynamically if needed or just rely on the fact that we can filter on the relationship.
                // Actually, to filter by foreign table column, we usually do:
                // .ilike('contatos.nome', ...) BUT this requires the resource to be embedded with !inner in the select.

                // Let's adjust the query construction slightly to handle this better:
                // If search is active, we must ensure we are using !inner for contatos
                // But our initial select uses standard syntax for embedding.
                // Let's restart the query definition logic for cleaner implementation if search is present.
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
    }, [filtros?.status, filtros?.forma_pagamento, filtros?.periodo, filtros?.search, getDateRange])

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

    // Calculate metrics
    const metrics: VendasMetrics = (() => {
        const now = new Date()
        const mesAtual = now.getMonth()
        const anoAtual = now.getFullYear()

        const vendasDoMes = vendas.filter((v) => {
            const dataVenda = new Date(v.data)
            return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual
        })

        const vendasNaoCanceladas = vendas.filter((v) => v.status !== 'cancelada')
        const vendasMesNaoCanceladas = vendasDoMes.filter((v) => v.status !== 'cancelada')

        const faturamentoTotal = vendasNaoCanceladas.reduce((acc, v) => acc + Number(v.total), 0)
        const faturamentoMes = vendasMesNaoCanceladas.reduce((acc, v) => acc + Number(v.total), 0)

        // Product metrics
        const produtosVendidos = vendasMesNaoCanceladas.reduce((acc, v) => {
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

        // Payment metrics
        const recebido = vendasNaoCanceladas
            .filter(v => v.pago === true)
            .reduce((acc, v) => acc + Number(v.total), 0)
        const aReceber = vendasNaoCanceladas
            .filter(v => v.pago !== true)
            .reduce((acc, v) => acc + Number(v.total), 0)

        // Delivery metrics
        const entregasPendentes = vendas.filter(v => v.status === 'pendente').length
        const entregasRealizadas = vendas.filter(v => v.status === 'entregue').length

        return {
            faturamentoTotal,
            faturamentoMes,
            totalVendas: vendasNaoCanceladas.length,
            vendasMes: vendasMesNaoCanceladas.length,
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
                observacoes: data.observacoes || null,
            }

            const { data: newVenda, error: vendaError } = await supabase
                .from('vendas')
                .insert(vendaInsert)
                .select()
                .single()

            if (vendaError) throw vendaError

            const typedVenda = newVenda as Venda

            // Insert items
            const itensInsert: ItemVendaInsert[] = data.itens.map((item) => ({
                venda_id: typedVenda.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
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
          itens:itens_venda(*, produto:produtos(*))
        `)
                .eq('id', id)
                .single()

            if (error) throw error

            const vendaData = data as unknown as VendaComItens
            return {
                ...vendaData,
                contato: Array.isArray(vendaData.contato) ? vendaData.contato[0] : vendaData.contato,
                itens: vendaData.itens ?? [],
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao buscar venda')
            return null
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
    }
}

// Hook for single venda detail
export function useVenda(id: string | undefined) {
    const [venda, setVenda] = useState<VendaComItens | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }

        const fetchVenda = async () => {
            setLoading(true)
            setError(null)

            try {
                const { data, error: queryError } = await supabase
                    .from('vendas')
                    .select(`
            *,
            contato:contatos(id, nome, telefone, tipo, status),
            itens:itens_venda(*, produto:produtos(id, nome, codigo, preco, unidade))
          `)
                    .eq('id', id)
                    .single()

                if (queryError) throw queryError

                const vendaData = data as unknown as VendaComItens
                setVenda({
                    ...vendaData,
                    contato: Array.isArray(vendaData.contato) ? vendaData.contato[0] : vendaData.contato,
                    itens: vendaData.itens ?? [],
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar venda')
            } finally {
                setLoading(false)
            }
        }

        fetchVenda()
    }, [id])

    return { venda, loading, error }
}
