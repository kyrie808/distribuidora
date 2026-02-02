import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ShoppingCart,
    Filter,
    Calendar,
    Truck,
    DollarSign,
    Search,
    Trash2,
    Edit,
    XCircle
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, EmptyState, LoadingScreen } from '../components/ui'
import { Modal, ModalActions } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { PaymentModal } from '../components/features/vendas/PaymentModal'

import { useVendas, type VendaComItens } from '../hooks/useVendas'
import { useScrollPersistence } from '../hooks/useScrollPersistence'
import { formatCurrency, formatDate, formatRelativeDate } from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'

type StatusFilter = 'todos' | 'pendente' | 'entregue' | 'cancelada'
type PeriodoFilter = 'todos' | 'hoje' | 'semana' | 'mes'
type PagamentoFilter = 'todos' | 'pago' | 'parcial' | 'pendente'

const PERIODO_LABELS = {
    todos: 'Todos',
    hoje: 'Hoje',
    semana: 'Esta semana',
    mes: 'Este mês',
}

export function Vendas() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // Derived state from URL
    const statusFilter = (searchParams.get('status') as StatusFilter) || 'todos'
    const periodoFilter = (searchParams.get('periodo') as PeriodoFilter) || 'todos'
    const pagamentoFilter = (searchParams.get('pagamento') as PagamentoFilter) || 'todos'

    // Helpers to update URL
    const setStatusFilter = (val: StatusFilter) => {
        setSearchParams(prev => {
            prev.set('status', val)
            return prev
        })
    }
    const setPeriodoFilter = (val: PeriodoFilter) => {
        setSearchParams(prev => {
            prev.set('periodo', val)
            return prev
        })
    }
    const setPagamentoFilter = (val: PagamentoFilter) => {
        setSearchParams(prev => {
            prev.set('pagamento', val)
            return prev
        })
    }

    const [showFilters, setShowFilters] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const [vendaToDelete, setVendaToDelete] = useState<string | null>(null)
    const [paymentVenda, setPaymentVenda] = useState<VendaComItens | null>(null) // State for payment modal

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Buscar TODAS as vendas do período para calcular contadores
    const { vendas, loading, error, metrics, deleteVenda, addPagamento, getVendaById } = useVendas({
        filtros: {
            status: 'todos', // Sempre buscar todas para contagens corretas
            forma_pagamento: 'todos',
            periodo: periodoFilter,
            search: debouncedSearch,
        },
    })

    // Persist Scroll
    useScrollPersistence('vendas_list', loading)

    // Filtragem local com ambos filtros (status + pagamento)
    const filteredVendas = useMemo(() => {
        return vendas.filter((venda) => {
            // Filtro de status de entrega
            if (statusFilter !== 'todos' && venda.status !== statusFilter) {
                return false
            }

            // Filtro de pagamento
            if (pagamentoFilter === 'pago') {
                if (!venda.pago || venda.forma_pagamento === 'brinde') return false
            }
            if (pagamentoFilter === 'parcial') {
                if (venda.pago || (venda.valor_pago || 0) === 0 || venda.forma_pagamento === 'brinde') return false
            }
            if (pagamentoFilter === 'pendente') {
                if (venda.pago || (venda.valor_pago || 0) > 0 || venda.forma_pagamento === 'brinde') return false
            }

            return true
        })
    }, [vendas, statusFilter, pagamentoFilter])

    // Contagens dinâmicas para badges (baseado em TODAS as vendas)
    const totalEntregasPendentes = vendas.filter(v => v.status === 'pendente').length
    const totalEntregues = vendas.filter(v => v.status === 'entregue').length
    const totalCanceladas = vendas.filter(v => v.status === 'cancelada').length

    // Status metrics logic updated
    const totalPagos = vendas.filter(v => v.pago === true).length
    const totalParcial = vendas.filter(v => !v.pago && (v.valor_pago || 0) > 0).length
    const totalPendentesFinanceiro = vendas.filter(v => !v.pago && (v.valor_pago || 0) === 0 && v.forma_pagamento !== 'brinde').length

    const hasActiveFilters = statusFilter !== 'todos' || periodoFilter !== 'todos' || pagamentoFilter !== 'todos'

    const clearFilters = () => {
        setSearchParams(prev => {
            prev.delete('status')
            prev.delete('periodo')
            prev.delete('pagamento')
            return prev
        })
    }

    const handleDelete = (id: string) => {
        setVendaToDelete(id)
    }

    const confirmDelete = async () => {
        if (!vendaToDelete) return
        await deleteVenda(vendaToDelete)
        setVendaToDelete(null)
    }

    // Handle opening payment modal - Fetches full details for history
    const handleOpenPayment = async (e: React.MouseEvent, vendaId: string) => {
        e.stopPropagation()
        const fullVenda = await getVendaById(vendaId)
        if (fullVenda) {
            setPaymentVenda(fullVenda)
        }
    }

    return (
        <>
            <Header
                title="Vendas"
                rightAction={
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${hasActiveFilters ? 'bg-white/20' : 'hover:bg-white/10'
                            }`}
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <p className="text-sm opacity-80">Faturamento do mês</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.faturamentoMes)}</p>
                    </Card>
                    <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
                        <p className="text-sm opacity-80">Vendas do mês</p>
                        <p className="text-2xl font-bold">{metrics.vendasMes}</p>
                    </Card>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nome do cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-col gap-2 mb-4 px-2 py-2">
                    {/* Grupo: Status de Entrega */}
                    <div className="flex items-center gap-1.5 px-0">
                        <Truck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex gap-1 overflow-x-auto p-1 pl-2 scrollbar-hide items-center flex-1">
                            <button
                                onClick={() => setStatusFilter('todos')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="gray"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'todos' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-gray-400 ring-offset-1'
                                        }`}
                                >
                                    {vendas.length} Todas
                                </Badge>
                            </button>
                            <button
                                onClick={() => setStatusFilter(statusFilter === 'entregue' ? 'todos' : 'entregue')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="success"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'entregue' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-success-500 ring-offset-1'
                                        }`}
                                >
                                    {totalEntregues} Entregues
                                </Badge>
                            </button>
                            <button
                                onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'todos' : 'pendente')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="warning"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'pendente' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-warning-500 ring-offset-1'
                                        }`}
                                >
                                    {totalEntregasPendentes} Pendentes
                                </Badge>
                            </button>
                            <button
                                onClick={() => {
                                    if (statusFilter === 'cancelada') {
                                        setStatusFilter('todos');
                                    } else {
                                        setStatusFilter('cancelada');
                                        setPagamentoFilter('todos');
                                    }
                                }}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                                title="Vendas Canceladas"
                            >
                                <Badge
                                    variant="danger"
                                    className={`h-7 flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'cancelada' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-danger-500 ring-offset-1'
                                        }`}
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>{totalCanceladas}</span>
                                </Badge>
                            </button>
                        </div>
                    </div>

                    {/* Grupo: Status de Pagamento */}
                    <div className="flex items-center gap-1.5 px-0">
                        <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex gap-1 overflow-x-auto p-1 pl-2 scrollbar-hide items-center flex-1">
                            <button
                                onClick={() => setPagamentoFilter('todos')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="gray"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'todos' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-gray-400 ring-offset-1'
                                        }`}
                                >
                                    Ver todas
                                </Badge>
                            </button>
                            <button
                                onClick={() => setPagamentoFilter(pagamentoFilter === 'pago' ? 'todos' : 'pago')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="success"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'pago' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-success-500 ring-offset-1'
                                        }`}
                                >
                                    {totalPagos} Quitados
                                </Badge>
                            </button>
                            <button
                                onClick={() => setPagamentoFilter(pagamentoFilter === 'parcial' ? 'todos' : 'parcial')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 bg-yellow-100 text-yellow-800 border-yellow-200 ${pagamentoFilter !== 'parcial' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-yellow-400 ring-offset-1'
                                        }`}
                                >
                                    {totalParcial} Parciais
                                </Badge>
                            </button>
                            <button
                                onClick={() => setPagamentoFilter(pagamentoFilter === 'pendente' ? 'todos' : 'pendente')}
                                className="focus:outline-none rounded-full flex-shrink-0 active:scale-95 transition-transform"
                            >
                                <Badge
                                    variant="warning"
                                    className={`h-7 flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'pendente' ? 'opacity-50 hover:opacity-70' : 'shadow-md ring-2 ring-warning-500 ring-offset-1'
                                        }`}
                                >
                                    {totalPendentesFinanceiro} Pendentes
                                </Badge>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <Card className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900">Filtros</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary-500 hover:text-primary-600"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        <div>
                            {/* Periodo Filter */}
                            <div className="max-w-xs">
                                <label className="text-sm text-gray-600 mb-1 block">Período</label>
                                <select
                                    value={periodoFilter}
                                    onChange={(e) => setPeriodoFilter(e.target.value as PeriodoFilter)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    {Object.entries(PERIODO_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading */}
                {loading && <LoadingScreen message="Carregando vendas..." />}

                {/* Error */}
                {error && (
                    <div className="bg-danger-50 text-danger-600 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filteredVendas.length === 0 && (
                    <EmptyState
                        icon={<ShoppingCart className="h-16 w-16" />}
                        title={hasActiveFilters ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
                        description={
                            hasActiveFilters
                                ? 'Tente ajustar os filtros'
                                : 'Registre sua primeira venda para começar'
                        }
                    />
                )}

                {/* Sales List */}
                {!loading && !error && filteredVendas.length > 0 && (
                    <div className="space-y-3">
                        {filteredVendas.map((venda) => (
                            <Card
                                key={venda.id}
                                hover
                                onClick={() => navigate(`/vendas/${venda.id}`)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div title={venda.contato?.nome || 'Cliente'} className="font-semibold text-gray-900 truncate w-[140px] sm:w-[150px]">
                                                {venda.contato?.nome || 'Cliente'}
                                            </div>
                                            {venda.status === 'cancelada' ? (
                                                <Badge variant="danger" className="w-36 justify-center py-1">
                                                    Cancelada
                                                </Badge>
                                            ) : (
                                                <>
                                                    <div title={VENDA_STATUS_LABELS[venda.status]} className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-gray-100 transition-colors">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${venda.status === 'entregue' ? 'bg-success-500' :
                                                            'bg-warning-500'
                                                            }`} />
                                                    </div>

                                                    {/* Badge Lógica Nova */}
                                                    {venda.forma_pagamento === 'brinde' ? (
                                                        <Badge variant="gray" className="w-28 justify-center whitespace-nowrap flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 ring-blue-200">
                                                            <span>🎁</span> Brinde
                                                        </Badge>
                                                    ) : venda.forma_pagamento === 'pre_venda' ? (
                                                        <Badge variant="gray" className="w-28 justify-center whitespace-nowrap flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 ring-purple-200">
                                                            <span>📅</span> Pré-venda
                                                        </Badge>
                                                    ) : venda.pago ? (
                                                        <Badge variant="success" className="w-28 justify-center whitespace-nowrap flex items-center gap-1">
                                                            <span>💰</span> Pago
                                                        </Badge>
                                                    ) : (venda.valor_pago || 0) > 0 ? (
                                                        <Badge className="w-28 justify-center whitespace-nowrap flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 ring-yellow-200">
                                                            <span>🕒</span> Parcial
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="warning" className="w-28 justify-center whitespace-nowrap flex items-center gap-1">
                                                            <span>⏳</span> Pendente
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(venda.data)}
                                            </span>
                                            <span>{FORMA_PAGAMENTO_LABELS[venda.forma_pagamento]}</span>
                                        </div>

                                        <p className="text-xs text-gray-400 mt-1">
                                            {venda.itens.reduce((acc, item) => acc + item.quantidade, 0)} item(s)
                                            {venda.valor_pago && venda.valor_pago > 0 && !venda.pago ? (
                                                <span className="ml-2 font-medium text-yellow-600">
                                                    (Pago: {formatCurrency(venda.valor_pago)})
                                                </span>
                                            ) : null}
                                        </p>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className="text-lg font-bold text-primary-600">
                                            {formatCurrency(Number(venda.total))}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatRelativeDate(venda.criado_em)}
                                        </p>

                                        <div className="flex items-center gap-1 mt-1">
                                            {/* Quick Actions */}
                                            {venda.status !== 'cancelada' && !venda.pago && venda.forma_pagamento !== 'brinde' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenPayment(e, venda.id)}
                                                    className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors relative z-10"
                                                    title="Informar Pagamento"
                                                >
                                                    <DollarSign className="h-4 w-4" />
                                                </button>
                                            )}

                                            {venda.status !== 'cancelada' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/vendas/${venda.id}/editar`)
                                                    }}
                                                    className="p-1.5 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors relative z-10"
                                                    title="Editar venda"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            )}

                                            {venda.status === 'cancelada' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(venda.id)
                                                    }}
                                                    className="p-1.5 hover:bg-danger-50 text-danger-500 rounded-lg transition-colors relative z-10"
                                                    title="Excluir venda cancelada"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer >


            <Modal
                isOpen={!!vendaToDelete}
                onClose={() => setVendaToDelete(null)}
                title="Confirmar Exclusão"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Tem certeza que deseja excluir esta venda cancelada? Esta ação não pode ser desfeita.
                    </p>
                    <ModalActions>
                        <Button
                            variant="ghost"
                            onClick={() => setVendaToDelete(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                        >
                            Excluir Venda
                        </Button>
                    </ModalActions>
                </div>
            </Modal>

            {/* Payment Modal */}
            {paymentVenda && (
                <PaymentModal
                    isOpen={!!paymentVenda}
                    onClose={() => setPaymentVenda(null)}
                    onConfirm={addPagamento}
                    vendaId={paymentVenda.id}
                    total={paymentVenda.total}
                    valorPago={paymentVenda.valor_pago || 0}
                    historico={paymentVenda.pagamentos || []}
                    customerName={paymentVenda.contato?.nome || 'Cliente'}
                />
            )}
        </>
    )
}
