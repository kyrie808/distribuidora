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



import { useVendas } from '../hooks/useVendas'
import { useDashboardFilter } from '../hooks/useDashboardFilter'
import { useDebounce } from '../hooks/useDebounce'
import { formatCurrency, formatDate } from '../utils/formatters'
import { FORMA_PAGAMENTO_LABELS } from '../constants'


type StatusFilter = 'todos' | 'pendente' | 'entregue' | 'cancelada'
type PagamentoFilter = 'todos' | 'pago' | 'parcial' | 'pendente'

export function Vendas() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // Global Filter - Logic Only
    const { startDate, endDate } = useDashboardFilter()

    // Derived state from URL (can be null if not selected)
    const statusFilter = searchParams.get('status') as StatusFilter | null
    const pagamentoFilter = searchParams.get('pagamento') as PagamentoFilter | null

    // Helpers to update URL with toggle logic
    const setStatusFilter = (val: StatusFilter) => {
        const newParams = new URLSearchParams(searchParams)
        const currentStatus = newParams.get('status')

        // Toggle Logic: If clicking the active filter, remove it
        if (val === currentStatus) {
            newParams.delete('status')
        } else {
            newParams.set('status', val)
        }

        // Mutual Exclusivity: Clear other filter
        newParams.delete('pagamento')

        setSearchParams(newParams)
    }

    const setPagamentoFilter = (val: PagamentoFilter) => {
        const newParams = new URLSearchParams(searchParams)
        const currentPayment = newParams.get('pagamento')

        // Toggle Logic: If active, remove it
        if (val === currentPayment) {
            newParams.delete('pagamento')
        } else {
            newParams.set('pagamento', val)
        }

        // Mutual Exclusivity
        newParams.delete('status')

        setSearchParams(newParams)
    }

    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    // Pass filters to hook
    // We always include pending items from all time to support the "Pendentes" badge/filter
    // The service handles the OR logic: (Date Range) OR (Status=Pending) OR (Payment=Pending)
    const { vendas, loading, deleteVenda } = useVendas({
        startDate,
        endDate,
        includePending: true,
        search: debouncedSearchTerm
    })
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [vendaToDelete, setVendaToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)



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



    // Filter logic (Note: Search is now handled server-side)
    const filteredVendas = useMemo(() => {
        // If NO filter is selected, return empty list (User Requirement)
        // EXCEPT if there's a search term
        if (!statusFilter && !pagamentoFilter && !debouncedSearchTerm) {
            return []
        }

        return vendas.filter(venda => {
            // Status
            if (statusFilter && statusFilter !== 'todos' && venda.status !== statusFilter) return false

            // Pagamento
            if (pagamentoFilter && pagamentoFilter !== 'todos') {
                const isPaid = venda.pago || venda.valorPago >= venda.total
                const isPartial = !isPaid && venda.valorPago > 0 && venda.valorPago < venda.total
                const isPending = !isPaid && venda.valorPago === 0

                if (pagamentoFilter === 'pago' && !isPaid) return false
                if (pagamentoFilter === 'parcial' && !isPartial) return false
                if (pagamentoFilter === 'pendente' && !isPending) return false
            }

            return true
        })
    }, [vendas, statusFilter, pagamentoFilter, debouncedSearchTerm])

    // Helper to check if a sale is within the selected date range
    // We need this because 'vendas' now includes ALL pending items, even outside the range.
    // For non-pending badges (like "Entregues"), we only want to count those in the range.
    const isInDateRange = (dateStr: string) => {
        if (!startDate || !endDate) return true

        // Parse date from string "YYYY-MM-DD"
        // Adjust for timezone to avoid "off by one" errors when comparing 
        // (Similar logic to service but in client)
        const d = new Date(dateStr + 'T12:00:00') // Noon to be safe
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        return d >= start && d <= end
    }

    // Counters for Delivery Row
    const deliveryCounts = useMemo(() => {
        return {
            // Todos: Should reflect "Vendas do Mês" usually. 
            // If we include all pending, 'todos' might look huge. 
            // Standard convention: "Todas" badge usually respects the global date filter.
            todos: vendas.filter(v => isInDateRange(v.data)).length,

            entregue: vendas.filter(v => v.status === 'entregue' && isInDateRange(v.data)).length,

            // Pendente: User requested ALL TIME pending
            pendente: vendas.filter(v => v.status === 'pendente').length,

            cancelada: vendas.filter(v => v.status === 'cancelada' && isInDateRange(v.data)).length
        }
    }, [vendas, startDate, endDate])

    // Counters for Payment Row
    const paymentCounts = useMemo(() => {
        return {
            // Todos: Respects date filter
            todos: vendas.filter(v => isInDateRange(v.data)).length,

            pago: vendas.filter(v => (v.pago || v.valorPago >= v.total) && isInDateRange(v.data)).length,

            parcial: vendas.filter(v => !v.pago && v.valorPago > 0 && v.valorPago < v.total && isInDateRange(v.data)).length,

            // Pendente: User requested ALL TIME pending
            pendente: vendas.filter(v => !v.pago && v.valorPago === 0).length
        }
    }, [vendas, startDate, endDate])




    if (loading) return <LoadingScreen message="Carregando vendas..." />

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className={cn(
                "relative flex h-auto min-h-screen w-full overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark",
                "relative flex h-auto min-h-screen w-full overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark flex-col"
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
                                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1 w-full min-w-0 pr-4 -mr-4">
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
                                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1 w-full min-w-0 pr-4 -mr-4">
                                        <Badge
                                            variant={pagamentoFilter === 'todos' ? 'primary' : 'gray'}
                                            onClick={() => setPagamentoFilter('todos')}
                                            className="cursor-pointer whitespace-nowrap px-3 py-1.5 flex items-center gap-2"
                                        >
                                            <span className="opacity-70">{paymentCounts.todos}</span> Ver todas
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
                                        className="group active:scale-[0.99] transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-lg border-l-4 border-l-transparent hover:border-l-primary"
                                        onClick={() => navigate(`/vendas/${venda.id}`)}
                                    >
                                        <CardHeader className="pb-2 p-5">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-xl text-gray-900 leading-tight truncate">
                                                        {venda.contato?.nome || 'Cliente Não Identificado'}
                                                    </h3>
                                                    <span className="text-xs text-muted-foreground font-mono mt-1 block">
                                                        #{venda.id.slice(0, 8)}
                                                    </span>
                                                </div>

                                                {/* Status Chips - Icon + Text */}
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                    {/* Delivery Status */}
                                                    <div className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm",
                                                        venda.status === 'entregue'
                                                            ? "bg-success/10 text-success-foreground border-success/20 dark:bg-success/20 dark:text-success dark:border-success/30"
                                                            : "bg-warning/10 text-yellow-700 border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30"
                                                    )}>
                                                        <Truck className="h-3.5 w-3.5" />
                                                        <span>{venda.status === 'entregue' ? 'Entregue' : 'Entrega Pendente'}</span>
                                                    </div>

                                                    {/* Payment Status */}
                                                    <div className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm",
                                                        (venda.pago || venda.valorPago >= venda.total)
                                                            ? "bg-success/10 text-success-foreground border-success/20 dark:bg-success/20 dark:text-success dark:border-success/30"
                                                            : "bg-warning/10 text-yellow-700 border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30"
                                                    )}>
                                                        <DollarSign className="h-3.5 w-3.5" />
                                                        <span>{(venda.pago || venda.valorPago >= venda.total) ? 'Pago' : 'Pagamento Pendente'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pb-4 p-5 pt-0">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(venda.data)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>{FORMA_PAGAMENTO_LABELS[venda.formaPagamento] || venda.formaPagamento}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-400">
                                                {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0 p-5 bg-gray-50/30 flex items-center justify-between border-t border-gray-100">
                                            {/* Trash Button - Discreet */}
                                            {venda.status !== 'cancelada' ? (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-gray-300 hover:text-danger-500 hover:bg-danger-50 -ml-2 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setVendaToDelete(venda.id)
                                                        setShowDeleteModal(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            ) : <div />}

                                            {/* Total - Highlighted */}
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
                                                    Total
                                                </span>
                                                <span className="text-2xl font-bold font-mono tracking-tight text-primary">
                                                    {formatCurrency(venda.total)}
                                                </span>
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
            </div>
        </div>
    )
}
