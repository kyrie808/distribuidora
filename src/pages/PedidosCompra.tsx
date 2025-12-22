import { useState, useEffect } from 'react'
import { Plus, CheckCircle, TrendingUp, DollarSign, Wallet, Settings } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, EmptyState, Button } from '../components/ui'
import { PurchaseOrderForm } from '../components/features/purchase-orders/PurchaseOrderForm'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import type { PurchaseOrderWithItems, PurchaseOrder } from '../types/database'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Spinner } from '../components/ui/Spinner'
import { ProductNicknamesModal } from '../components/features/purchase-orders/ProductNicknamesModal'


export function PedidosCompra() {
    const {
        fetchOrders,
        fetchOrderById,
        createOrder,
        updateOrder,
        receiveOrder,
        loading
    } = usePurchaseOrders()

    const [orders, setOrders] = useState<PurchaseOrderWithItems[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isNicknamesOpen, setIsNicknamesOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithItems | null>(null)
    const [isReceiving, setIsReceiving] = useState<string | null>(null)

    useEffect(() => {
        loadOrders()
    }, [fetchOrders]) // dependencies verified

    const loadOrders = async () => {
        const data = await fetchOrders()
        if (data) setOrders(data)
    }

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
        // Find the full order data from the list first (since we now fetch everything)
        // If deep copy needed or fresh fetch prefered:
        const detailedOrder = await fetchOrderById(orderId)
        if (detailedOrder) {
            setSelectedOrder(detailedOrder)
            setIsFormOpen(true)
        }
    }

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
        } catch (err) {
            alert('Erro ao receber pedido.')
        } finally {
            setIsReceiving(null)
        }
    }

    const getProductSize = (name: string, unit: string) => {
        // Tenta encontrar padrões como "1kg", "4kg", "500g", "2L" no nome do produto
        // Regex: \d+ (número) + opcionalmente espaço + (kg|g|l|ml|un) (unidade)
        const match = name.match(/(\d+(?:[\.,]\d+)?\s*(?:kg|g|l|ml|un|mts))/i)

        if (match) {
            // Se encontrar, retorna o padrão encontrado (ex: "1kg") sem espaços extras
            return match[0].replace(/\s+/g, '').toLowerCase()
        }

        // Se não encontrar, retorna a unidade padrão do banco
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
        <>
            <Header
                title="Pedidos de Compra"
                rightAction={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setIsNicknamesOpen(true)} title="Configurar Apelidos">
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleCreateNew}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Pedido
                        </Button>
                    </div>
                }
            />

            <PageContainer>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white/80 font-medium text-sm">Total Pedido</h3>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(kpis.totalPedido)}</p>
                        <p className="text-xs text-white/60 mt-1">Total em pedidos realizados</p>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-danger-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium text-sm">Valor em Aberto</h3>
                            <div className="p-2 bg-danger-50 rounded-lg">
                                <Wallet className="w-5 h-5 text-danger-500" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalAberto)}</p>
                        <p className="text-xs text-gray-400 mt-1">Total a pagar aos fornecedores</p>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-success-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium text-sm">Valor Pago</h3>
                            <div className="p-2 bg-success-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-success-500" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalPago)}</p>
                        <p className="text-xs text-gray-400 mt-1">Total já liquidado</p>
                    </Card>
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
                        <div className="overflow-x-auto">
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


                                {orders.map((order) => (
                                    <tbody key={order.id} className="border-b-[16px] border-white group hover:bg-gray-50/50 transition-colors shadow-sm">
                                        {/* Order Title Row */}
                                        <tr className="bg-violet-50/30">
                                            <td colSpan={6} className="px-4 py-3 text-xs font-bold text-violet-700 border-b border-violet-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                                        Pedido #{orderNumbers.get(order.id)}
                                                    </span>
                                                    <span className="text-gray-400 font-normal text-[10px] uppercase tracking-wider">
                                                        {order.id.slice(0, 8)}
                                                    </span>
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
                                                {/* Data - Only show on first row of the order group for cleanliness, or repeat? 
                                                    User asked for "Primeira coluna: Data". Repeating it ensures clarity per line.
                                                */}
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
                                                    <div className="text-gray-600 font-medium">
                                                        Valor do pedido {order.notes ? `(${order.notes}) ` : ''}
                                                        {order.supplier_id ? `${order.supplier_id} ` : ''}
                                                        <span className="text-emerald-600 font-bold ml-1">{formatCurrency(order.total_amount)}</span>
                                                        <span className="text-gray-500 font-normal ml-2">
                                                            = ({order.total_amount > 0 ? ((order.amount_paid / order.total_amount) * 100).toFixed(0) : 0}% pago)
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2">
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
                                            </td>
                                        </tr>
                                    </tbody>
                                ))}
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
            </PageContainer>
        </>
    )
}
