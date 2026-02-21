import { useState } from 'react'
import { Plus, TrendingUp, DollarSign, Wallet, Settings } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, EmptyState, Button } from '../components/ui'
import { PurchaseOrderForm } from '../components/features/purchase-orders/PurchaseOrderForm'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import type { DomainPurchaseOrderWithItems, CreatePurchaseOrder, UpdatePurchaseOrder } from '../types/domain'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Spinner } from '../components/ui/Spinner'
import { ProductNicknamesModal } from '../components/features/purchase-orders/ProductNicknamesModal'
import { KpiCard } from '../components/dashboard/KpiCard'

export function PedidosCompra() {
    const {
        orders,
        loading,
        createOrder,
        updateOrder,
        refetch
    } = usePurchaseOrders()

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isNicknamesOpen, setIsNicknamesOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DomainPurchaseOrderWithItems | null>(null)

    // Calcula KPIs
    const kpis = orders.reduce((acc, order) => {
        if (order.status === 'cancelled') return acc
        return {
            totalPedido: acc.totalPedido + order.totalAmount,
            totalPago: acc.totalPago + order.amountPaid,
            totalAberto: acc.totalAberto + (order.totalAmount - order.amountPaid)
        }
    }, { totalPedido: 0, totalPago: 0, totalAberto: 0 })

    const handleCreateNew = () => {
        setSelectedOrder(null)
        setIsFormOpen(true)
    }

    const handleEdit = (order: DomainPurchaseOrderWithItems) => {
        setSelectedOrder(order)
        setIsFormOpen(true)
    }

    const _handleSave = async (orderData: CreatePurchaseOrder | UpdatePurchaseOrder, items: any[]) => {
        if (selectedOrder) {
            await updateOrder({ id: selectedOrder.id, updates: orderData as UpdatePurchaseOrder })
        } else {
            await createOrder({ order: orderData as CreatePurchaseOrder, items })
        }
        refetch()
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-8">
                <Header
                    title="Pedidos de Compra"
                    showBack
                    centerTitle
                    rightAction={
                        <div className="flex gap-2">
                            <button onClick={() => setIsNicknamesOpen(true)} className="p-2 rounded-full"><Settings /></button>
                            <button onClick={handleCreateNew} className="p-2 rounded-full text-semantic-green"><Plus /></button>
                        </div>
                    }
                />

                <PageContainer className="px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <KpiCard title="Total Pedido" value={formatCurrency(kpis.totalPedido)} icon={DollarSign} />
                        <KpiCard title="Valor em Aberto" value={formatCurrency(kpis.totalAberto)} icon={Wallet} />
                        <KpiCard title="Valor Pago" value={formatCurrency(kpis.totalPago)} icon={TrendingUp} />
                    </div>

                    {loading && !orders.length ? <Spinner /> : orders.length === 0 ? (
                        <EmptyState title="Nenhum pedido" description="Crie seu primeiro pedido." action={<Button onClick={handleCreateNew}>Novo Pedido</Button>} />
                    ) : (
                        <Card className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3 text-center">Situação</th>
                                    </tr>
                                </thead>
                                {orders.map((order) => (
                                    <tbody key={order.id}>
                                        <tr onClick={() => handleEdit(order as DomainPurchaseOrderWithItems)} className="cursor-pointer hover:bg-gray-50">
                                            <td className="px-4 py-3">{formatDate(order.orderDate)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(order.totalAmount)}</td>
                                            <td className="px-4 py-3 text-center">{order.paymentStatus}</td>
                                        </tr>
                                    </tbody>
                                ))}
                            </table>
                        </Card>
                    )}

                    {isFormOpen && (
                        <PurchaseOrderForm
                            isOpen={isFormOpen}
                            onClose={() => setIsFormOpen(false)}
                            onSave={_handleSave}
                        />
                    )}

                    {isNicknamesOpen && (
                        <ProductNicknamesModal
                            isOpen={isNicknamesOpen}
                            onClose={() => setIsNicknamesOpen(false)}
                        />
                    )}
                </PageContainer>
            </div>
        </div>
    )
}
