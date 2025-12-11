import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ShoppingCart,
    Filter,
    Calendar,
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
    const [showFilters, setShowFilters] = useState(false)

    const { vendas, loading, error, metrics } = useVendas({
        filtros: {
            status: statusFilter,
            forma_pagamento: 'todos',
            periodo: periodoFilter,
        },
    })
    const { getNomeIndicador } = useContatos()

    const hasActiveFilters = statusFilter !== 'todos' || periodoFilter !== 'todos'

    const clearFilters = () => {
        setStatusFilter('todos')
        setPeriodoFilter('todos')
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

                        <div className="grid grid-cols-2 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="todos">Todos</option>
                                    {Object.entries(VENDA_STATUS_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Periodo Filter */}
                            <div>
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
                {!loading && !error && vendas.length === 0 && (
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
                {!loading && !error && vendas.length > 0 && (
                    <div className="space-y-3">
                        {vendas.map((venda) => (
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
