import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ShoppingCart,
    Calendar,
    DollarSign,
    Search,
    Trash2,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardContent, CardFooter, Badge, EmptyState, LoadingScreen } from '../components/ui'
import { cn } from '@/lib/utils'
import { Modal, ModalActions } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { PaymentModal } from '../components/features/vendas/PaymentModal'

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

    const { vendas, loading, deleteVenda, refetch, addPagamento } = useVendas()

    // Persistence
    useScrollPersistence('vendas-scroll', loading)

    const [searchTerm, setSearchTerm] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [vendaToDelete, setVendaToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false)
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
        setShowPaymentModal(true)
    }

    const handlePaymentConfirm = async (data: PagamentoFormData): Promise<boolean> => {
        if (!selectedVendaId) return false
        const success = await addPagamento(selectedVendaId, data)
        if (success) {
            await refetch()
            setShowPaymentModal(false)
            setSelectedVendaId(null)
            return true
        }
        return false
    }

    // Filter logic (Client side for now, consistent with previous behavior)
    const filteredVendas = useMemo(() => {
        return vendas.filter(venda => {
            // Status
            if (statusFilter !== 'todos' && venda.status !== statusFilter) return false

            // Pagamento
            if (pagamentoFilter !== 'todos') {
                if (pagamentoFilter === 'pago' && !venda.pago) return false
                if (pagamentoFilter === 'pendente' && venda.pago) return false
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


    const selectedVenda = vendas.find(v => v.id === selectedVendaId)

    if (loading) return <LoadingScreen message="Carregando vendas..." />

    return (
        <>
            <Header title="Vendas" showBack />
            <PageContainer>
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

                    {/* Quick Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <Badge
                            variant={statusFilter === 'todos' ? 'primary' : 'gray'}
                            onClick={() => setStatusFilter('todos')}
                            className="cursor-pointer"
                        >
                            Todas
                        </Badge>
                        <Badge
                            variant={statusFilter === 'pendente' ? 'warning' : 'gray'}
                            onClick={() => setStatusFilter('pendente')}
                            className="cursor-pointer"
                        >
                            Pendentes
                        </Badge>
                        <Badge
                            variant={statusFilter === 'entregue' ? 'success' : 'gray'}
                            onClick={() => setStatusFilter('entregue')}
                            className="cursor-pointer"
                        >
                            Entregues
                        </Badge>
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

                {/* MODAL DE PAGAMENTO */}
                {selectedVenda && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onConfirm={handlePaymentConfirm}
                        vendaId={selectedVenda.id}
                        total={selectedVenda.total}
                        valorPago={selectedVenda.valorPago || 0}
                        historico={selectedVenda.pagamentos || []}
                        customerName={selectedVenda.contato?.nome || 'Cliente'}
                    />
                )}
            </PageContainer>
        </>
    )
}
