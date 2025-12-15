import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ShoppingCart,
    Filter,
    Calendar,
    Truck,
    DollarSign,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, EmptyState, LoadingScreen } from '../components/ui'
import { ClienteNome } from '../components/contatos'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import { formatCurrency, formatDate, formatRelativeDate } from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'

type StatusFilter = 'todos' | 'pendente' | 'entregue' | 'cancelada'
type PeriodoFilter = 'todos' | 'hoje' | 'semana' | 'mes'
type PagamentoFilter = 'todos' | 'pago' | 'nao_pago'

const PERIODO_LABELS = {
    todos: 'Todos',
    hoje: 'Hoje',
    semana: 'Esta semana',
    mes: 'Este mês',
}

export function Vendas() {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
    const [periodoFilter, setPeriodoFilter] = useState<PeriodoFilter>('todos')
    const [pagamentoFilter, setPagamentoFilter] = useState<PagamentoFilter>('todos')
    const [showFilters, setShowFilters] = useState(false)

    // Buscar TODAS as vendas do período para calcular contadores
    const { vendas, loading, error, metrics } = useVendas({
        filtros: {
            status: 'todos', // Sempre buscar todas para contagens corretas
            forma_pagamento: 'todos',
            periodo: periodoFilter,
        },
    })
    const { getNomeIndicador } = useContatos()

    // Filtragem local com ambos filtros (status + pagamento)
    const filteredVendas = useMemo(() => {
        return vendas.filter((venda) => {
            // Filtro de status de entrega
            if (statusFilter !== 'todos' && venda.status !== statusFilter) {
                return false
            }

            // Filtro de pagamento
            if (pagamentoFilter === 'pago' && !venda.pago) return false
            if (pagamentoFilter === 'nao_pago' && venda.pago) return false

            return true
        })
    }, [vendas, statusFilter, pagamentoFilter])

    // Contagens dinâmicas para badges (baseado em TODAS as vendas)
    const totalEntregasPendentes = vendas.filter(v => v.status === 'pendente').length
    const totalEntregues = vendas.filter(v => v.status === 'entregue').length
    const totalCanceladas = vendas.filter(v => v.status === 'cancelada').length
    const totalPagos = vendas.filter(v => v.pago === true).length
    const totalAReceber = vendas.filter(v => v.pago === false).length

    const hasActiveFilters = statusFilter !== 'todos' || periodoFilter !== 'todos' || pagamentoFilter !== 'todos'

    const clearFilters = () => {
        setStatusFilter('todos')
        setPeriodoFilter('todos')
        setPagamentoFilter('todos')
    }

    const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'warning' => {
        switch (status) {
            case 'entregue':
                return 'success'
            case 'cancelada':
                return 'danger'
            default:
                return 'warning'
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


                {/* Filter Chips - Linha Única com Scroll Horizontal */}
                <div className="flex gap-2 mb-4 overflow-x-auto px-2 py-2">
                    {/* Grupo: Status de Entrega */}
                    <button
                        onClick={() => setStatusFilter('todos')}
                        className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="gray"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'todos' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            <Truck className="h-3 w-3 mr-1 inline" />
                            {vendas.length} Todas
                        </Badge>
                    </button>
                    <button
                        onClick={() => setStatusFilter('pendente')}
                        className="focus:outline-none focus:ring-2 focus:ring-warning-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="warning"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'pendente' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            {totalEntregasPendentes} Pendentes
                        </Badge>
                    </button>
                    <button
                        onClick={() => setStatusFilter('entregue')}
                        className="focus:outline-none focus:ring-2 focus:ring-success-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="success"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'entregue' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            {totalEntregues} Entregues
                        </Badge>
                    </button>
                    <button
                        onClick={() => setStatusFilter('cancelada')}
                        className="focus:outline-none focus:ring-2 focus:ring-danger-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="danger"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${statusFilter !== 'cancelada' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            {totalCanceladas} Canceladas
                        </Badge>
                    </button>

                    {/* Separador Visual */}
                    <div className="w-px bg-gray-300 mx-2 h-6 self-center shrink-0" />

                    {/* Grupo: Status de Pagamento */}
                    <button
                        onClick={() => setPagamentoFilter('todos')}
                        className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="gray"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'todos' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            <DollarSign className="h-3 w-3 mr-1 inline" />
                            {vendas.length} Todas
                        </Badge>
                    </button>
                    <button
                        onClick={() => setPagamentoFilter('pago')}
                        className="focus:outline-none focus:ring-2 focus:ring-success-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="success"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'pago' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            {totalPagos} Pagos
                        </Badge>
                    </button>
                    <button
                        onClick={() => setPagamentoFilter('nao_pago')}
                        className="focus:outline-none focus:ring-2 focus:ring-warning-500 rounded-full overflow-hidden"
                    >
                        <Badge
                            variant="warning"
                            className={`whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${pagamentoFilter !== 'nao_pago' ? 'opacity-50 hover:opacity-70' : 'shadow-sm'
                                }`}
                        >
                            {totalAReceber} A Receber
                        </Badge>
                    </button>
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
                                            <div className="font-semibold text-gray-900 truncate">
                                                {venda.contato ? (
                                                    <ClienteNome contato={venda.contato} />
                                                ) : (
                                                    'Cliente desconhecido'
                                                )}
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(venda.status)}>
                                                {VENDA_STATUS_LABELS[venda.status]}
                                            </Badge>
                                            {venda.pago ? (
                                                <Badge variant="success">💰 Pago</Badge>
                                            ) : (
                                                <Badge variant="gray">⏳ Não pago</Badge>
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
                                            {venda.contato?.origem === 'indicacao' && (
                                                <span className="ml-2 text-accent-600">
                                                    📣 {getNomeIndicador(venda.contato?.indicado_por_id ?? null)
                                                        ? `Indicado por: ${getNomeIndicador(venda.contato?.indicado_por_id ?? null)}`
                                                        : 'Indicação'}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary-600">
                                            {formatCurrency(Number(venda.total))}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatRelativeDate(venda.criado_em)}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer>
        </>
    )
}
