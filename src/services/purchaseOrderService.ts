import { supabase } from '../lib/supabase'
import type { DomainPurchaseOrderWithItems, CreatePurchaseOrder, UpdatePurchaseOrder } from '../types/domain'
import { toDomainPurchaseOrderWithItems } from './mappers'

export const purchaseOrderService = {
    async fetchOrders(): Promise<DomainPurchaseOrderWithItems[]> {
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
        return (data || []).map(toDomainPurchaseOrderWithItems)
    },

    async fetchOrderById(id: string): Promise<DomainPurchaseOrderWithItems | null> {
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
        if (!data) return null

        return toDomainPurchaseOrderWithItems(data)
    },

    async createOrder(order: CreatePurchaseOrder, items: any[]): Promise<DomainPurchaseOrderWithItems> {
        // Implementation remains similar but uses mappers for return
        const { data: newOrder, error: orderError } = await supabase
            .from('purchase_orders')
            .insert({
                fornecedor_id: order.fornecedorId,
                order_date: order.orderDate,
                total_amount: order.totalAmount,
                notes: order.notes,
                payment_status: 'unpaid',
                status: 'pending'
            })
            .select()
            .single()

        if (orderError) throw orderError

        const orderItems = items.map(item => ({
            purchase_order_id: newOrder.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            total_cost: item.quantity * item.unitCost
        }))

        const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        return this.fetchOrderById(newOrder.id) as Promise<DomainPurchaseOrderWithItems>
    },

    async updateOrder(id: string, updates: UpdatePurchaseOrder): Promise<DomainPurchaseOrderWithItems> {
        const dbUpdates: any = {}
        if (updates.fornecedorId !== undefined) dbUpdates.fornecedor_id = updates.fornecedorId
        if (updates.orderDate !== undefined) dbUpdates.order_date = updates.orderDate
        if (updates.status !== undefined) dbUpdates.status = updates.status
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes
        if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount
        if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus
        if (updates.dataRecebimento !== undefined) dbUpdates.data_recebimento = updates.dataRecebimento

        const { error } = await supabase
            .from('purchase_orders')
            .update(dbUpdates)
            .eq('id', id)

        if (error) throw error
        return this.fetchOrderById(id) as Promise<DomainPurchaseOrderWithItems>
    },

    async deleteOrder(id: string): Promise<void> {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async addPayment(orderId: string, payment: { amount: number, method: string, notes?: string }): Promise<void> {
        const { error: paymentError } = await supabase
            .from('purchase_order_payments')
            .insert({
                purchase_order_id: orderId,
                amount: payment.amount,
                payment_method: payment.method,
                notes: payment.notes,
                payment_date: new Date().toISOString()
            })

        if (paymentError) throw paymentError

        // Update order payment status
        const order = await this.fetchOrderById(orderId)
        if (!order) return

        const totalPaid = order.amountPaid + payment.amount
        let newStatus: DomainPurchaseOrderWithItems['paymentStatus'] = 'partial'
        if (totalPaid >= order.totalAmount) newStatus = 'paid'

        const { error: updateError } = await supabase
            .from('purchase_orders')
            .update({
                amount_paid: totalPaid,
                payment_status: newStatus
            })
            .eq('id', orderId)

        if (updateError) throw updateError
    }
}
