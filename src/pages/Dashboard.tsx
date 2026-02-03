import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Package,
    RefreshCcw,
    Trophy,
    ChevronRight,
    ClipboardList,
} from 'lucide-react'
import { AlertasFinanceiroWidget } from '../components/dashboard/AlertasFinanceiroWidget'
import { AlertasRecompraWidget } from '../components/dashboard/AlertasRecompraWidget'
import { EstoqueWidget } from '../components/dashboard/EstoqueWidget'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardContent, Badge, Button } from '../components/ui'
import { MonthPicker } from '../components/dashboard/MonthPicker'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import { useRecompra } from '../hooks/useRecompra'
import { useIndicacoes } from '../hooks/useIndicacoes'
import { useDashboardFilter } from '../hooks/useDashboardFilter'
import { formatCurrency, formatRelativeDate } from '../utils/formatters'
import { VENDA_STATUS_LABELS } from '../constants'
import { cn } from '@/lib/utils'

export function Dashboard() {
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { startDate, endDate } = useDashboardFilter()

    // Fetch data
    const { vendas, metrics, loading: loadingVendas, refetch: refetchVendas } = useVendas({ startDate, endDate })
    const { loading: loadingContatos, refetch: refetchContatos } = useContatos({})
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

    // UI Helpers

    const ultimasVendas = vendas.slice(0, 5)
    const topIndicadores = indicadores.slice(0, 3)

    // KPI Card Component
    const KpiCard = ({ title, value, icon: Icon, colorClass, subtext, onClick }: any) => (
        <Card
            className={cn("relative overflow-hidden transition-all hover:shadow-md", onClick && "cursor-pointer active:scale-[0.99]")}
            onClick={onClick}
        >
            <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{title}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</span>
                        </div>
                        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                    </div>
                    <div className={cn("p-2 rounded-full", colorClass)}>
                        <Icon className="h-5 w-5 opacity-90" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <>
            <Header
                title="Dashboard"
                rightAction={
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={cn(
                            "p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500",
                            isRefreshing && "animate-spin"
                        )}
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {/* Global Filter */}
                <div className="mb-6 sticky top-[60px] z-20 bg-gray-50/95 backdrop-blur py-2 -mx-4 px-4 border-b border-gray-200/50 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mx-0">
                    <MonthPicker />
                </div>

                {loading && !isRefreshing && (
                    <div className="flex flex-col items-center justify-center p-12 gap-4 text-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 font-medium">Carregando indicadores...</p>
                    </div>
                )}

                {!loading && (
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                        {/* 📊 BIG NUMBERS (KPIs) */}
                        <section>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Faturamento */}
                                <KpiCard
                                    title="Faturamento"
                                    value={formatCurrency(metrics.faturamentoMes)}
                                    icon={DollarSign}
                                    colorClass="bg-primary/10 text-primary"
                                    subtext="neste mês"
                                />

                                {/* Lucro */}
                                <KpiCard
                                    title="Lucro Estimado"
                                    value={formatCurrency((metrics as any).lucroMes || 0)}
                                    icon={TrendingUp}
                                    colorClass="bg-green-100 text-green-700"
                                    subtext="margem aproximada"
                                />

                                {/* A Receber */}
                                <KpiCard
                                    title="A Receber"
                                    value={formatCurrency(metrics.aReceber)}
                                    icon={Clock}
                                    colorClass="bg-amber-100 text-amber-700"
                                    onClick={() => navigate('/vendas?pagamento=nao_pago')}
                                    subtext="pendente total"
                                />

                                {/* Ticket Médio */}
                                <KpiCard
                                    title="Ticket Médio"
                                    value={formatCurrency(metrics.ticketMedio)}
                                    icon={Shopping}
                                    colorClass="bg-indigo-100 text-indigo-700"
                                />
                            </div>
                        </section>

                        {/* 🚨 WIDGETS CRÍTICOS (COCKPIT) */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Coluna Principal: Alertas */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AlertasFinanceiroWidget />
                                    <AlertasRecompraWidget
                                        contatos={recompraContatos}
                                        atrasados={atrasados}
                                        loading={loadingRecompra}
                                    />
                                </div>

                                {/* Estoque Alert */}
                                <EstoqueWidget />
                            </div>

                            {/* Coluna Lateral: Resumo Operacional */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Operacional
                                </h3>

                                <Card className="divide-y divide-gray-100">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => navigate('/vendas?status=pendente')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 p-2 rounded-lg">
                                                <Package className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{metrics.entregasPendentes}</p>
                                                <p className="text-xs text-gray-500">Entregas Pendentes</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300" />
                                    </div>
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => navigate('/vendas?status=entregue')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-lg">
                                                <Package className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{metrics.entregasRealizadas}</p>
                                                <p className="text-xs text-gray-500">Entregas Realizadas</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300" />
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{metrics.vendasMes}</p>
                                                <p className="text-xs text-gray-500">Vendas no Mês</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-dashed bg-gray-50/50"
                                    onClick={() => navigate('/relatorio-fabrica')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                                            <ClipboardList className="h-5 w-5 text-gray-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Relatório Fábrica</p>
                                            <p className="text-xs text-gray-500">Separar carga para amanhã</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        {/* 👇 LISTAGENS SECUNDÁRIAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                            {/* Últimas Vendas */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-primary" />
                                        Últimas Vendas
                                    </h2>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-primary font-normal text-sm"
                                        onClick={() => navigate('/vendas')}
                                    >
                                        Ver todas
                                    </Button>
                                </div>

                                {ultimasVendas.length === 0 ? (
                                    <Card className="p-8 text-center text-gray-400 bg-gray-50 border-dashed">
                                        <p>Nenhuma venda recente</p>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {ultimasVendas.map((venda) => (
                                            <Card
                                                key={venda.id}
                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => navigate(`/vendas/${venda.id}`)}
                                            >
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="font-semibold text-gray-900 truncate">
                                                            {venda.contato?.nome || 'Cliente'}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{formatRelativeDate(venda.criadoEm)}</span>
                                                            {venda.status !== 'entregue' && (
                                                                <Badge variant="outline" className="text-[10px] px-1 h-5">{VENDA_STATUS_LABELS[venda.status]}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-bold text-gray-900">{formatCurrency(Number(venda.total))}</span>
                                                        {venda.pago ? (
                                                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 rounded">PAGO</span>
                                                        ) : (
                                                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded">PENDENTE</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Top Indicadores (Gamification Lite) */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        Campeões de Indicação
                                    </h2>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-primary font-normal text-sm"
                                        onClick={() => navigate('/indicacoes')}
                                    >
                                        Ver Ranking
                                    </Button>
                                </div>

                                {topIndicadores.length === 0 ? (
                                    <Card className="p-8 text-center text-gray-400 bg-gray-50 border-dashed">
                                        <p>Nenhuma indicação ainda</p>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {topIndicadores.map((item, index) => (
                                            <Card
                                                key={item.indicador.id}
                                                className="cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
                                                onClick={() => navigate(`/contatos/${item.indicador.id}`)}
                                            >
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                    index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-300" : "bg-orange-300"
                                                )} />
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                                                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                                                            index === 1 ? "bg-gray-100 text-gray-700" :
                                                                "bg-orange-100 text-orange-700"
                                                    )}>
                                                        {index + 1}º
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{item.indicador.nome}</p>
                                                        <p className="text-xs text-muted-foreground">{item.indicacoesConvertidas} conversões</p>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-0">
                                                        +{formatCurrency(item.recompensaAcumulada)}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </PageContainer >
        </>
    )
}

function Shopping({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    )
}

function Clock({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
