import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ShoppingCart,
    Calendar,
    Search,
    Trash2,
    Truck,
    DollarSign,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardContent, CardFooter, Badge, EmptyState, LoadingScreen } from '../components/ui'
import { cn } from '@/lib/utils'
import { Modal, ModalActions } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { PaymentSidebar } from '../components/features/vendas/PaymentSidebar'

import { useVendas } from '../hooks/useVendas'
import { useScrollPersistence } from '../hooks/useScrollPersistence'
import { formatCurrency, formatDate } from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'
import type { PagamentoFormData } from '../schemas/venda'

type StatusFilter = 'todos' | 'pendente' | 'entregue' | 'cancelada'
type PagamentoFilter = 'todos' | 'pago' | 'parcial' | 'pendente'

export function Vendas() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // Derived state from URL
    const statusFilter = (searchParams.get('status') as StatusFilter) || 'todos'
    const pagamentoFilter = (searchParams.get('pagamento') as PagamentoFilter) || 'todos'

    // Helpers to update URL
    const setStatusFilter = (val: StatusFilter) => {
        setSearchParams(prev => {
            prev.set('status', val)
            return prev
        })
    }

    const setPagamentoFilter = (val: PagamentoFilter) => {
        setSearchParams(prev => {
            prev.set('pagamento', val)
            return prev
        })
    }

    const { vendas, loading, deleteVenda, refetch, addPagamento } = useVendas()

    // Persistence
    useScrollPersistence('vendas-scroll', loading)

    const [searchTerm, setSearchTerm] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [vendaToDelete, setVendaToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Payment Sidebar (similar to cart in NovaVenda)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!vendaToDelete) return
        setIsDeleting(true)
        const success = await deleteVenda(vendaToDelete)
        if (success) {
            setShowDeleteModal(false)
            setVendaToDelete(null)
        }
        setIsDeleting(false)
    }

    const handlePaymentClick = (e: React.MouseEvent, vendaId: string) => {
        e.stopPropagation()
        setSelectedVendaId(vendaId)
        setIsPaymentOpen(true)
    }

    const handlePaymentConfirm = async (data: PagamentoFormData): Promise<boolean> => {
        if (!selectedVendaId) return false
        const success = await addPagamento(selectedVendaId, data)
        if (success) {
            await refetch()
            setIsPaymentOpen(false)
            setSelectedVendaId(null)
            return true
        }
        return false
    }

    const handlePaymentBack = () => {
        setIsPaymentOpen(false)
        setSelectedVendaId(null)
    }

    // Filter logic
    const filteredVendas = useMemo(() => {
        return vendas.filter(venda => {
            // Status
            if (statusFilter !== 'todos' && venda.status !== statusFilter) return false

            // Pagamento
            if (pagamentoFilter !== 'todos') {
                const isPaid = venda.valorPago >= venda.total
                const isPartial = venda.valorPago > 0 && venda.valorPago < venda.total
                const isPending = venda.valorPago === 0

                if (pagamentoFilter === 'pago' && !isPaid) return false
                if (pagamentoFilter === 'parcial' && !isPartial) return false
                if (pagamentoFilter === 'pendente' && !isPending) return false
            }

            // Search
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const cliente = venda.contato?.nome?.toLowerCase() || ''
                const id = venda.id.toLowerCase().slice(0, 8)
                return cliente.includes(term) || id.includes(term)
            }

            return true
        })
    }, [vendas, statusFilter, pagamentoFilter, searchTerm])

    // Counters for Delivery Row
    const deliveryCounts = useMemo(() => {
        return {
            todos: vendas.length,
            entregue: vendas.filter(v => v.status === 'entregue').length,
            pendente: vendas.filter(v => v.status === 'pendente').length,
            cancelada: vendas.filter(v => v.status === 'cancelada').length
        }
    }, [vendas])

    // Counters for Payment Row
    const paymentCounts = useMemo(() => {
        return {
            todos: vendas.length,
            pago: vendas.filter(v => v.valorPago >= v.total).length,
            parcial: vendas.filter(v => v.valorPago > 0 && v.valorPago < v.total).length,
            pendente: vendas.filter(v => v.valorPago === 0).length
        }
    }, [vendas])


    const selectedVenda = vendas.find(v => v.id === selectedVendaId)

    if (loading) return <LoadingScreen message="Carregando vendas..." />

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className={cn(
                "relative flex h-auto min-h-screen w-full overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark",
                isPaymentOpen ? "md:flex-row" : "flex-col"
            )}>
                {/* Main content */}
                <div className="flex-1 flex flex-col pb-24">
                    <Header title="Vendas" showBack centerTitle />
                    <PageContainer className="pt-0 pb-32 bg-transparent px-4">
                        {/* Search & Stats */}
                        <div className="mb-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente ou ID..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Improved Dual Filters */}
                            <div className="space-y-3 pb-2">
                                {/* Delivery Filters */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                        <Badge
                                            variant={statusFilter === 'todos' ? 'primary' : 'gray'}
                                            onClick={() => setStatusFilter('todos')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{deliveryCounts.todos}</span> Todas
                                        </Badge>
                                        <Badge
                                            variant={statusFilter === 'entregue' ? 'success' : 'gray'}
                                            onClick={() => setStatusFilter('entregue')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{deliveryCounts.entregue}</span> Entregues
                                        </Badge>
                                        <Badge
                                            variant={statusFilter === 'pendente' ? 'warning' : 'gray'}
                                            onClick={() => setStatusFilter('pendente')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{deliveryCounts.pendente}</span> Pendentes
                                        </Badge>
                                        <Badge
                                            variant={statusFilter === 'cancelada' ? 'danger' : 'gray'}
                                            onClick={() => setStatusFilter('cancelada')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{deliveryCounts.cancelada}</span> Canceladas
                                        </Badge>
                                    </div>
                                </div>

                                {/* Payment Filters */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                        <Badge
                                            variant={pagamentoFilter === 'todos' ? 'primary' : 'gray'}
                                            onClick={() => setPagamentoFilter('todos')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
                                        >
                                            Ver todas
                                        </Badge>
                                        <Badge
                                            variant={pagamentoFilter === 'pago' ? 'success' : 'gray'}
                                            onClick={() => setPagamentoFilter('pago')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{paymentCounts.pago}</span> Quitados
                                        </Badge>
                                        <Badge
                                            variant={pagamentoFilter === 'parcial' ? 'warning' : 'gray'}
                                            onClick={() => setPagamentoFilter('parcial')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{paymentCounts.parcial}</span> Parciais
                                        </Badge>
                                        <Badge
                                            variant={pagamentoFilter === 'pendente' ? 'danger' : 'gray'}
                                            onClick={() => setPagamentoFilter('pendente')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{paymentCounts.pendente}</span> Pendentes
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredVendas.length === 0 ? (
                            <EmptyState
                                icon={<ShoppingCart className="h-12 w-12 text-gray-400" />}
                                title="Nenhuma venda encontrada"
                                description="Tente ajustar os filtros ou crie uma nova venda."
                                action={
                                    <Button onClick={() => navigate('/nova-venda')}>
                                        Nova Venda
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="space-y-4">
                                {filteredVendas.map((venda) => (
                                    <Card
                                        key={venda.id}
                                        className="active:scale-[0.98] transition-transform overflow-hidden cursor-pointer hover:shadow-md border-l-4 border-l-transparent hover:border-l-primary"
                                        onClick={() => navigate(`/vendas/${venda.id}`)}
                                    >
                                        <CardHeader className="pb-2 p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                        {venda.contato?.nome || 'Cliente Não Identificado'}
                                                    </h3>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        #{venda.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <Badge variant={
                                                    venda.status === 'entregue' ? 'success' :
                                                        venda.status === 'cancelada' ? 'danger' : 'warning'
                                                }>
                                                    {VENDA_STATUS_LABELS[venda.status]}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pb-2 p-4 pt-0">
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{formatDate(venda.data)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    <span>{FORMA_PAGAMENTO_LABELS[venda.formaPagamento] || venda.formaPagamento}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0 p-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                                    Total
                                                </span>
                                                <span className={cn(
                                                    "text-xl font-bold",
                                                    venda.pago ? "text-success-600" : "text-warning-600"
                                                )}>
                                                    {formatCurrency(venda.total)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {venda.pago ? (
                                                    <div className="flex items-center gap-1 text-success-600 text-sm font-medium">
                                                        <Badge variant="success">Pago</Badge>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="warning"
                                                        onClick={(e) => handlePaymentClick(e, venda.id)}
                                                        className="h-9 px-4"
                                                    >
                                                        Receber
                                                    </Button>
                                                )}

                                                {venda.status !== 'cancelada' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 text-gray-400 hover:text-danger-500 hover:bg-danger-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setVendaToDelete(venda.id)
                                                            setShowDeleteModal(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        <Modal
                            isOpen={showDeleteModal}
                            onClose={() => setShowDeleteModal(false)}
                            title="Excluir Venda"
                            size="sm"
                        >
                            <p className="text-gray-600 mb-4">
                                Tem certeza que deseja excluir esta venda?
                                <br />
                                <span className="text-sm text-gray-500">
                                    Esta ação não pode ser desfeita.
                                </span>
                            </p>
                            <ModalActions>
                                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                                    Excluir
                                </Button>
                            </ModalActions>
                        </Modal>
                    </PageContainer>
                </div>

                {/* Desktop Payment Sidebar */}
                {isPaymentOpen && selectedVenda && (
                    <aside className="hidden md:flex w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-screen sticky top-0">
                        <PaymentSidebar
                            onBack={handlePaymentBack}
                            onConfirm={handlePaymentConfirm}
                            vendaId={selectedVenda.id}
                            total={selectedVenda.total}
                            valorPago={selectedVenda.valorPago || 0}
                            historico={selectedVenda.pagamentos || []}
                            customerName={selectedVenda.contato?.nome || 'Cliente'}
                        />
                    </aside>
                )}

                {/* Mobile Payment Drawer */}
                {isPaymentOpen && selectedVenda && (
                    <div className="fixed inset-0 z-[60] md:hidden flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={handlePaymentBack}
                        />
                        {/* Drawer */}
                        <div className="relative w-[85vw] max-w-sm bg-white dark:bg-gray-800 h-[100dvh] shadow-2xl transform transition-transform animate-slide-in-right overflow-hidden">
                            <PaymentSidebar
                                onBack={handlePaymentBack}
                                onConfirm={handlePaymentConfirm}
                                vendaId={selectedVenda.id}
                                total={selectedVenda.total}
                                valorPago={selectedVenda.valorPago || 0}
                                historico={selectedVenda.pagamentos || []}
                                customerName={selectedVenda.contato?.nome || 'Cliente'}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
