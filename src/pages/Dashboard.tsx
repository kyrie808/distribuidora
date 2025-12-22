import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    AlertCircle,
    Trophy,
    ChevronRight,
    RefreshCcw,
    Bell,
    Share2,
    Package,
    ClipboardList,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, LoadingScreen } from '../components/ui'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import { useRecompra } from '../hooks/useRecompra'
import { useIndicacoes } from '../hooks/useIndicacoes'
import { formatCurrency, formatRelativeDate } from '../utils/formatters'
import { VENDA_STATUS_LABELS } from '../constants'

export function Dashboard() {
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch data
    const { vendas, metrics, loading: loadingVendas, refetch: refetchVendas } = useVendas({})
    const { contatos, loading: loadingContatos, refetch: refetchContatos, getNomeIndicador } = useContatos({})
    const { contatos: recompraContatos, atrasados, loading: loadingRecompra, refetch: refetchRecompra } = useRecompra()
    const { indicadores, loading: loadingIndicacoes, refetch: refetchIndicacoes } = useIndicacoes()

    const loading = loadingVendas || loadingContatos || loadingRecompra || loadingIndicacoes

    // Pull to refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await Promise.all([
            refetchVendas(),
            refetchContatos(),
            refetchRecompra(),
            refetchIndicacoes(),
        ])
        setIsRefreshing(false)
    }, [refetchVendas, refetchContatos, refetchRecompra, refetchIndicacoes])

    // Derived metrics
    const clientesAtivos = contatos.filter((c) => c.status === 'cliente').length
    const ultimasVendas = vendas.slice(0, 5)
    const topIndicadores = indicadores.slice(0, 3)
    const alertasUrgentes = recompraContatos.filter((c) => c.status === 'atrasado').slice(0, 5)

    // Variation (placeholder - would need previous month data)
    const variacao = metrics.vendasMes > 0 ? '+12%' : '0%'

    return (
        <>
            <Header
                title="Dashboard"
                rightAction={
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${isRefreshing ? 'animate-spin' : ''
                            }`}
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {loading && !isRefreshing && <LoadingScreen message="Carregando dashboard..." />}

                {!loading && (
                    <div className="space-y-6">
                        {/* 💰 FINANCEIRO */}
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" /> Financeiro
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Faturamento do Mês */}
                                <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <DollarSign className="h-5 w-5 opacity-80" />
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                            {variacao}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatCurrency(metrics.faturamentoMes)}</p>
                                    <p className="text-sm opacity-80">Faturamento do mês</p>
                                </Card>

                                {/* Ticket Médio */}
                                <Card>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-5 w-5 text-success-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(metrics.ticketMedio)}
                                    </p>
                                    <p className="text-sm text-gray-500">Ticket médio</p>
                                </Card>

                                {/* Recebido */}
                                {/* Lucro do Mês */}
                                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="h-5 w-5 opacity-80" />
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📈</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatCurrency((metrics as any).lucroMes || 0)}</p>
                                    <p className="text-sm opacity-80">Lucro do mês</p>
                                </Card>

                                {/* A Receber */}
                                <Card
                                    className="bg-gradient-to-br from-amber-500 to-amber-600 text-white cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => navigate('/vendas?pagamento=nao_pago')}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <DollarSign className="h-5 w-5 opacity-80" />
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">⏳</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatCurrency(metrics.aReceber)}</p>
                                    <p className="text-sm opacity-80">A Receber</p>
                                </Card>
                            </div>
                        </section>

                        {/* 📦 VENDAS E ENTREGAS */}
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" /> Vendas & Entregas
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Vendas do Mês */}
                                <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <ShoppingCart className="h-5 w-5 opacity-80" />
                                    </div>
                                    <p className="text-2xl font-bold">{metrics.vendasMes}</p>
                                    <p className="text-sm opacity-80">Vendas do mês</p>
                                </Card>

                                {/* Produtos Vendidos */}
                                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <Package className="h-5 w-5 opacity-80" />
                                    </div>
                                    <p className="text-2xl font-bold">{metrics.produtosVendidos?.total || 0} itens</p>
                                    <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-90 space-y-0.5 font-medium">
                                        <div className="flex justify-between">
                                            <span>1kg:</span>
                                            <span>{metrics.produtosVendidos?.pote1kg || 0} potes</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>4kg:</span>
                                            <span>{metrics.produtosVendidos?.pote4kg || 0} potes</span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Entregas Pendentes */}
                                <Card
                                    className="border-l-4 border-l-warning-500 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => navigate('/vendas?status=pendente')}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-5 w-5 text-warning-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{metrics.entregasPendentes}</p>
                                    <p className="text-sm text-gray-500">Entregas Pendentes</p>
                                </Card>

                                {/* Entregas Realizadas */}
                                <Card
                                    className="border-l-4 border-l-success-500 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => navigate('/vendas?status=entregue')}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-5 w-5 text-success-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{metrics.entregasRealizadas}</p>
                                    <p className="text-sm text-gray-500">Entregas Realizadas</p>
                                </Card>
                            </div>
                        </section>

                        {/* 👥 CLIENTES */}
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Clientes
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <Card>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-5 w-5 text-primary-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{clientesAtivos}</p>
                                    <p className="text-sm text-gray-500">Clientes ativos</p>
                                </Card>

                                {/* Link Relatório Fábrica */}
                                <Card
                                    hover
                                    onClick={() => navigate('/relatorio-fabrica')}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClipboardList className="h-5 w-5 text-accent-500" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">Pedido Fábrica</p>
                                    <p className="text-sm text-gray-500">Gerar relatório</p>
                                </Card>
                            </div>
                        </section>

                        {/* Alertas de Recompra */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-danger-500" />
                                    Alertas de Recompra
                                    {atrasados > 0 && (
                                        <Badge variant="danger">{atrasados}</Badge>
                                    )}
                                </h2>
                                <button
                                    onClick={() => navigate('/recompra')}
                                    className="text-sm text-primary-500 font-medium flex items-center gap-1"
                                >
                                    Ver todos <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {alertasUrgentes.length === 0 ? (
                                <Card className="text-center py-8 text-gray-500">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum cliente atrasado</p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {alertasUrgentes.map((item) => (
                                        <Card
                                            key={item.contato.id}
                                            hover
                                            onClick={() => navigate(`/contatos/${item.contato.id}`)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                                                        <AlertCircle className="h-4 w-4 text-danger-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.contato.nome}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.diasSemCompra} dias sem comprar
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Top Indicadores */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-accent-500" />
                                    Top Indicadores
                                </h2>
                                <button
                                    onClick={() => navigate('/indicacoes')}
                                    className="text-sm text-primary-500 font-medium flex items-center gap-1"
                                >
                                    Ver todos <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {topIndicadores.length === 0 ? (
                                <Card className="text-center py-8 text-gray-500">
                                    <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Sem indicações ainda</p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {topIndicadores.map((item, index) => (
                                        <Card
                                            key={item.indicador.id}
                                            hover
                                            onClick={() => navigate(`/contatos/${item.indicador.id}`)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : index === 1
                                                                ? 'bg-gray-200 text-gray-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                            }`}
                                                    >
                                                        {index + 1}º
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.indicador.nome}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.indicacoesConvertidas} clientes convertidos
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="success">
                                                    {formatCurrency(item.recompensaAcumulada)}
                                                </Badge>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Últimas Vendas */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-primary-500" />
                                    Últimas Vendas
                                </h2>
                                <button
                                    onClick={() => navigate('/vendas')}
                                    className="text-sm text-primary-500 font-medium flex items-center gap-1"
                                >
                                    Ver todas <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {ultimasVendas.length === 0 ? (
                                <Card className="text-center py-8 text-gray-500">
                                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma venda registrada</p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {ultimasVendas.map((venda) => (
                                        <Card
                                            key={venda.id}
                                            hover
                                            onClick={() => navigate(`/vendas/${venda.id}`)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-medium text-gray-900 truncate w-[130px] sm:w-[150px]">
                                                            {venda.contato?.nome || 'Cliente'}
                                                        </div>
                                                        <div className="flex items-center gap-2">
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
                                                                    {venda.pago ? (
                                                                        <Badge variant="success" className="w-28 justify-center whitespace-nowrap flex items-center gap-1">
                                                                            <span>💰</span> Pago
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="warning" className="w-28 justify-center whitespace-nowrap flex items-center gap-1">
                                                                            <span>⏳</span> Não pago
                                                                        </Badge>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {formatRelativeDate(venda.criado_em)}
                                                        {venda.contato?.origem === 'indicacao' && (
                                                            <span className="ml-1 text-accent-600">
                                                                • 📣 {getNomeIndicador(venda.contato?.indicado_por_id ?? null)
                                                                    ? `Indicado por: ${getNomeIndicador(venda.contato?.indicado_por_id ?? null)}`
                                                                    : 'Indicação'}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-primary-600 flex-shrink-0">
                                                    {formatCurrency(Number(venda.total))}
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </PageContainer>
        </>
    )
}
