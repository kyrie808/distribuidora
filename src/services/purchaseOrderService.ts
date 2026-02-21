import { supabase } from '../lib/supabase'
import type { PurchaseOrder, PurchaseOrderWithItems } from '../types/database'

export const purchaseOrderService = {
    async fetchOrders(): Promise<PurchaseOrderWithItems[]> {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                fornecedor:contatos(nome),
                items:purchase_order_items(
                    *,
                    product:produtos(*)
                ),
                payments:purchase_order_payments(*)
            `)
            .order('order_date', { ascending: false })

        if (error) throw error
        return data as PurchaseOrderWithItems[]
    },

    async fetchOrderById(id: string): Promise<PurchaseOrderWithItems | null> {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                fornecedor:contatos(nome),
                items:purchase_order_items(
                    *,
                    product:produtos(*)
                ),
                payments:purchase_order_payments(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        const order = data as PurchaseOrderWithItems
        if (order && order.payments) {
            order.payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
        }
        return order
    },

    async createOrder(order: Partial<PurchaseOrder>, items: any[]): Promise<PurchaseOrder> {
        // 1. Create Header
        const { data, error: orderError } = await supabase
            .from('purchase_orders')
            .insert({
                fornecedor_id: order.fornecedor_id!,
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
        const orderData = data as PurchaseOrder

        // 2. Create Items
        if (items.length > 0) {
            const itemsToInsert = items.map(item => ({
                purchase_order_id: orderData.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost
            }))

            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsToInsert as any)

            if (itemsError) throw itemsError
        }

        return orderData
    },

    async updateOrder(id: string, updates: Partial<PurchaseOrder>, items?: any[]): Promise<boolean> {
        // 1. Update Header
        const { error: headerError } = await supabase
            .from('purchase_orders')
            .update(updates as any)
            .eq('id', id)

        if (headerError) throw headerError

        // 2. Update Items (Full Replace Strategy)
        if (items) {
            const { error: deleteError } = await supabase
                .from('purchase_order_items')
                .delete()
                .eq('purchase_order_id', id)

            if (deleteError) throw deleteError

            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    purchase_order_id: id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost
                }))

                const { error: insertError } = await supabase
                    .from('purchase_order_items')
                    .insert(itemsToInsert as any)

                if (insertError) throw insertError
            }
        }

        return true
    },

    async receiveOrder(id: string): Promise<boolean> {
        const { error } = await supabase.rpc('receive_purchase_order', { p_order_id: id })
        if (error) throw error
        return true
    },

    async deleteOrder(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    async addPayment(orderId: string, paymentData: { amount: number, payment_method: string, payment_date: string, notes?: string }): Promise<boolean> {
        const { error } = await supabase
            .from('purchase_order_payments')
            .insert({
                purchase_order_id: orderId,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method,
                payment_date: paymentData.payment_date,
                notes: paymentData.notes
            } as any)

        if (error) throw error
        return true
    }
}
