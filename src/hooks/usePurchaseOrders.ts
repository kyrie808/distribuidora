import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { PurchaseOrder, PurchaseOrderWithItems } from '../types/database'

export function usePurchaseOrders() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`
                    *,
                    items:purchase_order_items(
                        *,
                        product:produtos(*)
                    ),
                    payments:purchase_order_payments(*)
                `)
                .order('order_date', { ascending: false })

            if (error) throw error
            return data as PurchaseOrderWithItems[]
        } catch (err: any) {
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchOrderById = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`
          *,
          items:purchase_order_items(
            *,
            product:produtos(*)
          ),
          payments:purchase_order_payments(*)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            // Sort payments by date desc locally
            const order = data as PurchaseOrderWithItems
            if (order.payments) {
                order.payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
            }
            return order
        } catch (err: any) {
            console.error('Error fetching order:', err)
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const createOrder = useCallback(async (order: Partial<PurchaseOrder>, items: any[]) => {
        setLoading(true)
        setError(null)
        try {
            // 1. Create Header
            const { data, error: orderError } = await supabase
                .from('purchase_orders')
                .insert({
                    supplier_id: order.supplier_id || 'Fabricante',
                    order_date: order.order_date,
                    status: order.status || 'pending',
                    payment_status: order.payment_status || 'unpaid',
                    total_amount: order.total_amount,
                    notes: order.notes,
                    amount_paid: order.amount_paid || 0,
                    data_recebimento: order.data_recebimento
                } as any)
                .select()
                .single()

            if (orderError) throw orderError

            // Fix TS error: ensure data is typed or accessed safely
            const orderData = data as PurchaseOrder

            // 2. Create Items
            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    purchase_order_id: orderData.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    total_cost: item.unit_cost * item.quantity
                }))

                const { error: itemsError } = await supabase
                    .from('purchase_order_items')
                    .insert(itemsToInsert as any) // Explicitly cast to avoid strict type mismatch on insert

                if (itemsError) throw itemsError
            }

            return orderData
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const updateOrder = useCallback(async (id: string, updates: Partial<PurchaseOrder>, items?: any[]) => {
        setLoading(true)
        setError(null)
        try {
            // 1. Update Header
            const { error: headerError } = await supabase
                .from('purchase_orders')
                .update(updates)
                .eq('id', id)

            if (headerError) throw headerError

            // 2. Update Items (Full Replace Strategy for simplicity in this iteration)
            if (items) {
                // Delete all existing items
                const { error: deleteError } = await supabase
                    .from('purchase_order_items')
                    .delete()
                    .eq('purchase_order_id', id)

                if (deleteError) throw deleteError

                // Re-insert items
                const itemsToInsert = items.map(item => ({
                    purchase_order_id: id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    total_cost: item.unit_cost * item.quantity
                }))

                const { error: insertError } = await supabase
                    .from('purchase_order_items')
                    .insert(itemsToInsert as any)

                if (insertError) throw insertError
            }

            return true
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const receiveOrder = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            // Force cast to any to bypass 'never' type on RPC function name due to missing types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.rpc as any)('receive_purchase_order', { p_order_id: id })

            if (error) throw error
            return true
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteOrder = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const addPayment = useCallback(async (orderId: string, paymentData: { amount: number, payment_method: string, payment_date: string, notes?: string }) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('purchase_order_payments')
                .insert({
                    purchase_order_id: orderId,
                    amount: paymentData.amount,
                    payment_method: paymentData.payment_method,
                    payment_date: paymentData.payment_date,
                    notes: paymentData.notes
                })

            if (error) throw error

            // Note: Trigger will update the order status
            return true
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        fetchOrders,
        fetchOrderById,
        createOrder,
        updateOrder,
        receiveOrder,
        deleteOrder,
        addPayment
    }
}
