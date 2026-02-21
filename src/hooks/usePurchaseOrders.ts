import { useState, useCallback } from 'react'
import { purchaseOrderService } from '../services/purchaseOrderService'
import type { PurchaseOrder } from '../types/database'

export function usePurchaseOrders() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            return await purchaseOrderService.fetchOrders()
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
            return await purchaseOrderService.fetchOrderById(id)
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
            return await purchaseOrderService.createOrder(order, items)
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
            return await purchaseOrderService.updateOrder(id, updates, items)
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
            return await purchaseOrderService.receiveOrder(id)
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
            return await purchaseOrderService.deleteOrder(id)
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
            return await purchaseOrderService.addPayment(orderId, paymentData)
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
