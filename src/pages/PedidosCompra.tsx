import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle, TrendingUp, DollarSign, Wallet, Settings, ChevronDown, ChevronUp, History } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, EmptyState, Button } from '../components/ui'
import { PurchaseOrderForm } from '../components/features/purchase-orders/PurchaseOrderForm'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import type { PurchaseOrderWithItems, PurchaseOrder } from '../types/database'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Spinner } from '../components/ui/Spinner'
import { ProductNicknamesModal } from '../components/features/purchase-orders/ProductNicknamesModal'
import { PurchaseOrderPaymentModal } from '../components/features/purchase-orders/PurchaseOrderPaymentModal'
import { KpiCard } from '../components/dashboard/KpiCard'

export function PedidosCompra() {
    const {
        fetchOrders,
        fetchOrderById,
        createOrder,
        updateOrder,
        receiveOrder,
        addPayment,
        loading
    } = usePurchaseOrders()

    const [orders, setOrders] = useState<PurchaseOrderWithItems[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isNicknamesOpen, setIsNicknamesOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithItems | null>(null)
    const [isReceiving, setIsReceiving] = useState<string | null>(null)

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [paymentOrder, setPaymentOrder] = useState<PurchaseOrderWithItems | null>(null)

    // Expanded rows state
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const loadOrders = useCallback(async () => {
        const data = await fetchOrders()
        if (data) setOrders(data)
    }, [fetchOrders])

    useEffect(() => {
        loadOrders()
    }, [loadOrders])

    // Calculate sequential order numbers
    const [orderNumbers, setOrderNumbers] = useState<Map<string, number>>(new Map())

    useEffect(() => {
        if (orders.length > 0) {
            const sorted = [...orders].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            const map = new Map<string, number>()
            sorted.forEach((order, index) => {
                map.set(order.id, index + 1)
            })
            setOrderNumbers(map)
        }
    }, [orders])

    // Calcula KPIs
    const kpis = orders.reduce((acc, order) => {
        if (order.status === 'cancelled') return acc

        const total = Number(order.total_amount) || 0
        const pago = Number(order.amount_paid) || 0

        return {
            totalPedido: acc.totalPedido + total,
            totalPago: acc.totalPago + pago,
            totalAberto: acc.totalAberto + (total - pago)
        }
    }, {
        totalPedido: 0,
        totalPago: 0,
        totalAberto: 0
    })

    const handleCreateNew = () => {
        setSelectedOrder(null)
        setIsFormOpen(true)
    }

    const handleEdit = async (orderId: string) => {
        const detailedOrder = await fetchOrderById(orderId)
        if (detailedOrder) {
            setSelectedOrder(detailedOrder)
            setIsFormOpen(true)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSave = async (orderData: Partial<PurchaseOrder>, items: any[]) => {
        if (selectedOrder) {
            await updateOrder(selectedOrder.id, orderData, items)
        } else {
            await createOrder(orderData, items)
        }
        await loadOrders()
    }

    const handleReceive = async (order: PurchaseOrder, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm(`Confirma o recebimento do pedido no valor de ${formatCurrency(order.total_amount)}?`)) {
            return
        }

        setIsReceiving(order.id)
        try {
            await receiveOrder(order.id)
            await loadOrders()
        } catch {
            alert('Erro ao receber pedido.')
        } finally {
            setIsReceiving(null)
        }
    }

    const handlePaymentClick = (order: PurchaseOrderWithItems, e: React.MouseEvent) => {
        e.stopPropagation()
        setPaymentOrder(order)
        setIsPaymentModalOpen(true)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConfirmPayment = async (data: any) => {
        if (!paymentOrder) return
        try {
            await addPayment(paymentOrder.id, data)
            await loadOrders()
        } catch (err) {
            console.error(err)
            alert('Erro ao registrar pagamento')
        }
    }

    const toggleRow = (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId)
        } else {
            newExpanded.add(orderId)
        }
        setExpandedRows(newExpanded)
    }


    const getProductSize = (name: string, unit: string) => {
        const match = name.match(/(\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|un|mts))/i)
        if (match) {
            return match[0].replace(/\s+/g, '').toLowerCase()
        }
        return unit || '-'
    }

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case 'paid': return <Badge variant="success">Pago</Badge>
            case 'partial': return <Badge variant="warning">Parcial</Badge>
            default: return <Badge variant="danger">Em Aberto</Badge>
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-8">
                <Header
                    title="Pedidos de Compra"
                    showBack
                    centerTitle
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                    rightAction={
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsNicknamesOpen(true)}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-800 dark:text-gray-200 transition-colors"
                                title="Configurar Apelidos"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCreateNew}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-semantic-green transition-colors"
                                title="Novo Pedido"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    }
                />

                <PageContainer className="pt-0 pb-16 bg-transparent px-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <KpiCard
                            title="Total Pedido"
                            value={formatCurrency(kpis.totalPedido)}
                            progress={100}
                            trend="Total"
                            trendDirection="up"
                            icon={DollarSign}
                            progressColor="bg-primary"
                            trendColor="green"
                            iconColor="text-primary"
                            variant="compact"
                        />

                        <KpiCard
                            title="Valor em Aberto"
                            value={formatCurrency(kpis.totalAberto)}
                            progress={kpis.totalPedido > 0 ? (kpis.totalAberto / kpis.totalPedido) * 100 : 0}
                            trend={kpis.totalPedido > 0 ? `${((kpis.totalAberto / kpis.totalPedido) * 100).toFixed(0)}%` : '0%'}
                            trendDirection="down"
                            icon={Wallet}
                            progressColor="bg-semantic-red"
                            trendColor="red"
                            iconColor="text-semantic-red"
                            variant="compact"
                        />

                        <KpiCard
                            title="Valor Pago"
                            value={formatCurrency(kpis.totalPago)}
                            progress={kpis.totalPedido > 0 ? (kpis.totalPago / kpis.totalPedido) * 100 : 0}
                            trend={kpis.totalPedido > 0 ? `${((kpis.totalPago / kpis.totalPedido) * 100).toFixed(0)}%` : '0%'}
                            trendDirection="up"
                            icon={TrendingUp}
                            progressColor="bg-semantic-green"
                            trendColor="green"
                            iconColor="text-semantic-green"
                            variant="compact"
                        />
                    </div>

                    {loading && !orders.length ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : orders.length === 0 ? (
                        <EmptyState
                            title="Nenhum pedido encontrado"
                            description="Comece criando um pedido de compra para seus fornecedores."
                            action={
                                <Button onClick={handleCreateNew}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Primeiro Pedido
                                </Button>
                            }
                        />
                    ) : (
                        <Card className="overflow-hidden p-0 shadow-sm border border-gray-200">
                            <div
                                className="overflow-x-auto"
                                style={{
                                    msOverflowStyle: 'none',
                                    scrollbarWidth: 'none',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                                onScroll={(e) => {
                                    const target = e.target as HTMLDivElement;
                                    const style = target.style as any;
                                    style.WebkitScrollbar = 'none';
                                }}
                            >
                                <style>{`
                                    .overflow-x-auto::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Data</th>
                                            <th className="px-4 py-3 font-semibold text-center">Qtd</th>
                                            <th className="px-4 py-3 font-semibold text-center">Tam</th>
                                            <th className="px-4 py-3 font-semibold text-right">Valor</th>
                                            <th className="px-4 py-3 font-semibold text-center">Recebi</th>
                                            <th className="px-4 py-3 font-semibold text-center">Situação</th>
                                        </tr>
                                    </thead>


                                    {orders.map((order) => {
                                        const percentPaid = order.total_amount > 0 ? (order.amount_paid / order.total_amount) * 100 : 0
                                        const isPaid = percentPaid >= 100
                                        const isExpanded = expandedRows.has(order.id)

                                        return (
                                            <tbody key={order.id} className="border-b-[16px] border-white group hover:bg-gray-50/50 transition-colors shadow-sm">
                                                {/* Order Title Row */}
                                                <tr className="bg-gray-50/80 dark:bg-surface-dark/50">
                                                    <td colSpan={6} className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold">
                                                                    Pedido #{orderNumbers.get(order.id)}
                                                                </span>
                                                                <span className="text-gray-400 font-normal text-[10px] uppercase tracking-wider">
                                                                    {order.id.slice(0, 8)}
                                                                </span>
                                                                {order.supplier_id && (
                                                                    <span className="ml-2 text-gray-600 font-semibold">{order.supplier_id}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {/* Payment Progress Bar */}
                                                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                        style={{ width: `${Math.min(percentPaid, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-500 font-medium w-12 text-right">
                                                                    {percentPaid.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Items Rows */}
                                                {order.items && order.items.map((item, index) => (
                                                    <tr
                                                        key={item.id || index}
                                                        className="border-b border-gray-100 last:border-0 hover:bg-white cursor-pointer"
                                                        onClick={() => handleEdit(order.id)}
                                                    >
                                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                            {formatDate(order.order_date)}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 text-center font-bold">
                                                            {item.quantity}
                                                            {item.product?.apelido && (
                                                                <span className="text-violet-600 ml-0.5">{item.product.apelido}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 text-center font-medium text-violet-600">
                                                            {getProductSize(item.product?.nome || '', item.product?.unidade || '-')}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-900 text-right">
                                                            {formatCurrency(item.unit_cost * item.quantity)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {order.data_recebimento ? (
                                                                <span className="text-gray-900">{formatDate(order.data_recebimento)}</span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {getPaymentBadge(order.payment_status)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Summary Row */}
                                                <tr className="bg-gray-50/80">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                                            <div className="text-gray-600 font-medium flex items-center gap-2" >
                                                                <button onClick={(e) => toggleRow(order.id, e)} className="flex items-center gap-1 hover:text-primary transition-colors">
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                    <span className="text-xs uppercase font-bold tracking-wider">Histórico Financeiro</span>
                                                                </button>
                                                                <span className="text-gray-300">|</span>
                                                                <span>Total: <span className="text-emerald-600 font-bold">{formatCurrency(order.total_amount)}</span></span>
                                                                <span className="text-sm text-gray-500">
                                                                    (Pago: {formatCurrency(order.amount_paid)})
                                                                </span>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="h-8 text-xs px-3 border-primary/20 text-primary hover:bg-primary/5"
                                                                    onClick={(e) => handlePaymentClick(order, e)}
                                                                    disabled={isPaid}
                                                                >
                                                                    <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                                                                    {isPaid ? 'Quitado' : 'Pagar'}
                                                                </Button>

                                                                <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleEdit(order.id)}>
                                                                    Editar
                                                                </Button>
                                                                {order.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="primary"
                                                                        className="h-8 text-xs px-3"
                                                                        onClick={(e) => handleReceive(order, e)}
                                                                        disabled={isReceiving === order.id}
                                                                    >
                                                                        {isReceiving === order.id ? 'Recebendo...' : 'Confirmar Recebimento'}
                                                                    </Button>
                                                                )}
                                                                {order.status === 'received' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        disabled
                                                                        className="h-8 text-xs px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-100 cursor-default font-semibold shadow-none"
                                                                        title={order.data_recebimento ? `Recebido em ${new Date(order.data_recebimento).toLocaleString()} ` : 'Data de recebimento não registrada'}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-1.5" />
                                                                        Recebido
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Expanded Payment History */}
                                                        {isExpanded && (
                                                            <div className="mt-2 bg-white rounded border border-gray-100 p-2 animate-in slide-in-from-top-2">
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                    <History className="w-3 h-3" /> Histórico de Pagamentos
                                                                </h4>
                                                                {order.payments && order.payments.length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        {order.payments.map((payment) => (
                                                                            <div key={payment.id} className="flex justify-between text-xs text-gray-600 bg-gray-50 p-1.5 rounded">
                                                                                <span>{formatDate(payment.payment_date)} - <span className="uppercase">{payment.payment_method}</span></span>
                                                                                <div className="flex gap-4">
                                                                                    {payment.notes && <span className="text-gray-400 italic">"{payment.notes}"</span>}
                                                                                    <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 italic ml-4">Nenhum pagamento registrado.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        )
                                    })}
                                </table>
                            </div>
                        </Card>
                    )}

                    <PurchaseOrderForm
                        isOpen={isFormOpen}
                        onClose={() => setIsFormOpen(false)}
                        onSave={handleSave}
                        initialData={selectedOrder}
                    />

                    <ProductNicknamesModal
                        isOpen={isNicknamesOpen}
                        onClose={() => {
                            setIsNicknamesOpen(false)
                            loadOrders() // Refresh to show new nicknames
                        }}
                    />

                    {paymentOrder && (
                        <PurchaseOrderPaymentModal
                            isOpen={isPaymentModalOpen}
                            onClose={() => {
                                setIsPaymentModalOpen(false)
                                setPaymentOrder(null)
                            }}
                            onConfirm={handleConfirmPayment}
                            order={paymentOrder}
                        />
                    )}
                </PageContainer>
            </div>
        </div>
    )
}
