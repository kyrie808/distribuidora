import { useState, useCallback, useEffect } from 'react'
import {
    Menu,
    Bell,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ShoppingBag,
    Package,
    Truck,
    CheckCircle,
    DollarSign,
    ShoppingCart,
    Users,
    ClipboardList
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import { useRecompra } from '../hooks/useRecompra'
import { useAlertasFinanceiros } from '../hooks/useAlertasFinanceiros'
import { useDashboardFilter } from '../hooks/useDashboardFilter'
import { useLogistica } from '../hooks/useLogistica'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// New Components
import { KpiCard } from '@/components/dashboard/KpiCard'
import { LogisticsWidget } from '@/components/dashboard/LogisticsWidget'
import { AlertasFinanceiroWidget } from '@/components/dashboard/AlertasFinanceiroWidget'
import { AlertasRecompraWidget } from '@/components/dashboard/AlertasRecompraWidget'
import { TopIndicadoresWidget } from '@/components/dashboard/TopIndicadoresWidget'
import { UltimasVendasWidget } from '@/components/dashboard/UltimasVendasWidget'
import { MonthPicker } from '@/components/dashboard/MonthPicker'
import { Skeleton } from '@/components/ui/Skeleton'

export function Dashboard() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [userName, setUserName] = useState<string>('Comandante')
    const [greeting, setGreeting] = useState<string>('Olá')
    const { startDate, endDate, setMonth } = useDashboardFilter()
    const navigate = useNavigate()

    // Greeting & User Logic
    useEffect(() => {
        const fetchUserAndGreeting = async () => {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email) {
                // Try to get first name from metadata or email
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
                const firstName = fullName?.split(' ')[0]
                // Capitalize first letter logic if needed, but usually data is okay
                if (firstName) setUserName(firstName)
            }

            // 2. Get Time for Greeting
            const currentHour = new Date().getHours()
            if (currentHour >= 5 && currentHour < 12) setGreeting('Bom dia')
            else if (currentHour >= 12 && currentHour < 18) setGreeting('Boa tarde')
            else setGreeting('Boa noite')
        }

        fetchUserAndGreeting()
    }, [])

    // Derive selected month string from global filter
    const selectedMonth = startDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').replace(/^./, str => str.toUpperCase())

    const handleMonthSelect = (month: string) => {
        // Map Portuguese months back to indices
        const monthsMap: { [key: string]: number } = {
            'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
            'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
        }

        const monthIndex = monthsMap[month]
        if (monthIndex !== undefined) {
            const currentYear = new Date().getFullYear()
            const newDate = new Date(currentYear, monthIndex, 1)
            setMonth(newDate)
        }
    }


    // Fetch data
    const { metrics, loading: loadingVendas, refetch: refetchVendas } = useVendas({ startDate, endDate })
    const { metrics: logisticsMetrics, loading: loadingLogistica, refetch: refetchLogistica } = useLogistica() // Global Operational Data
    const { contatos: recompraContatos, refetch: refetchRecompra } = useRecompra()
    const { contatos: allContacts, loading: loadingContatos, refetch: refetchContatos } = useContatos()
    const { alertas: alertasFinanceiros, loading: loadingFinanceiro, refetch: refetchFinanceiro } = useAlertasFinanceiros()

    const loading = loadingVendas || loadingFinanceiro || loadingLogistica || loadingContatos

    // Pull to refresh action
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await Promise.all([
            refetchVendas(),
            refetchRecompra(),
            refetchFinanceiro(),
            refetchLogistica(),
            refetchContatos()
        ])
        setIsRefreshing(false)
    }, [refetchVendas, refetchRecompra, refetchFinanceiro, refetchLogistica, refetchContatos])

    // Calculations for KPIs
    const revenueTarget = 165000 // From HTML: $165k
    const revenueProgress = Math.min((metrics.faturamentoMes / revenueTarget) * 100, 100)





    // War Zone Data Extraction
    const atrasadosRecompra = recompraContatos.filter(c => c.status === 'atrasado').length
    const totalAlerts = atrasadosRecompra + alertasFinanceiros.length

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark">

                {/* TopAppBar */}
                <header className="flex items-center px-6 py-4 justify-between sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                    <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <Menu className="text-gray-800 dark:text-gray-200 w-6 h-6" />
                    </button>
                    <div className="flex-1 flex justify-center">
                        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                            {greeting}, {userName}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
                            onClick={handleRefresh}
                        >
                            <Bell className={cn("text-gray-800 dark:text-gray-200 w-6 h-6", isRefreshing && "animate-spin")} />
                            {totalAlerts > 0 && (
                                <span className="absolute top-2 right-2 size-2 bg-semantic-red rounded-full border-2 border-background-light dark:border-background-dark animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col gap-6 px-4 pb-32">

                    {/* Month Picker */}
                    <MonthPicker selectedMonth={selectedMonth} onMonthSelect={handleMonthSelect} />

                    {loading ? (
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Revenue Skeleton */}
                                <Skeleton className="h-[140px] w-full rounded-xl col-span-2 md:col-span-1" />
                                {/* Margin Skeleton */}
                                <Skeleton className="h-[140px] w-full rounded-xl col-span-1" />
                                {/* Orders Skeleton */}
                                <Skeleton className="h-[140px] w-full rounded-xl col-span-1" />
                                <Skeleton className="h-[140px] w-full rounded-xl col-span-1" />
                            </div>
                            {/* Widget Skeletons */}
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <Skeleton className="h-[100px] w-full rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {/* Financeiro Header */}
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Financeiro
                                </span>
                            </div>

                            {/* KPI Cards Grid - Faturamento, Ticket Médio, Lucro, A Receber */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {/* Faturamento - Neon Green */}
                                <KpiCard
                                    title="Faturamento"
                                    value={formatCurrency(metrics.faturamentoMes)}
                                    progress={revenueProgress}
                                    trend="12%"
                                    trendDirection="up"
                                    targetLabel="Meta: 165k"
                                    progressColor="bg-primary"
                                    trendColor="green"
                                    icon={TrendingUp}
                                    className="col-span-2 md:col-span-1"
                                    variant="default"
                                />

                                {/* Ticket Médio - Blue/Info */}
                                <KpiCard
                                    title="Ticket Médio"
                                    value={formatCurrency(metrics.ticketMedio)}
                                    // Simulated progress/trend for Ticket Médio if not available
                                    progress={75}
                                    trend="R$ 5,00"
                                    trendDirection="up"
                                    progressColor="bg-blue-500"
                                    trendColor="green"
                                    icon={ArrowUp}
                                    className="col-span-1"
                                    variant="compact"
                                />

                                {/* Lucro - Semantic Green */}
                                <KpiCard
                                    title="Lucro"
                                    value={formatCurrency(metrics.lucroMes)}
                                    progress={metrics.totalVendas > 0 ? (metrics.lucroMes / metrics.totalVendas) * 100 : 0}
                                    trend={`${metrics.totalVendas > 0 ? ((metrics.lucroMes / metrics.totalVendas) * 100).toFixed(1) : '0'}%`}
                                    trendDirection={(metrics.totalVendas > 0 ? (metrics.lucroMes / metrics.totalVendas) * 100 : 0) > 20 ? "up" : "down"}
                                    progressColor="bg-semantic-green"
                                    trendColor="green"
                                    icon={TrendingUp} // Or DollarSign if available
                                    className="col-span-1"
                                    variant="compact"
                                />

                                {/* A Receber - Semantic Yellow */}
                                <KpiCard
                                    title="A Receber"
                                    value={formatCurrency(metrics.aReceber)}
                                    progress={50} // Arbitrary or calculated based on total credit
                                    trend="Pendente"
                                    trendDirection="neutral"
                                    progressColor="bg-semantic-yellow"
                                    trendColor="yellow"
                                    icon={TrendingDown} // Or Clock/AlertCircle
                                    className="col-span-1"
                                    variant="compact"
                                />
                            </div>

                            {/* Vendas & Entregas Header */}
                            <div className="flex items-center gap-2 mb-2 mt-2 px-1">
                                <ShoppingCart className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Vendas & Entregas
                                </span>
                            </div>

                            {/* Sales & Operations Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Vendas - Neon Green/Primary */}
                                <KpiCard
                                    title="Vendas"
                                    value={metrics.totalVendas.toString()}
                                    progress={70} // Simulated or calc based on target
                                    trend="24" // Simulated trend
                                    trendDirection="up"
                                    progressColor="bg-primary"
                                    trendColor="green"
                                    icon={ShoppingBag}
                                    className="col-span-1"
                                    variant="compact"
                                />

                                {/* Itens Vendidos - Blue/Info */}
                                <KpiCard
                                    title="Itens"
                                    value={metrics.produtosVendidos.total.toString()}
                                    progress={65}
                                    trend="Vol"
                                    trendDirection="neutral"
                                    progressColor="bg-blue-500"
                                    trendColor="primary"
                                    icon={Package}
                                    className="col-span-1"
                                    variant="compact"
                                />

                                {/* Entregas Pendentes - Yellow/Warning */}
                                <KpiCard
                                    title="Pendentes"
                                    value={metrics.entregasPendentes.toString()}
                                    progress={metrics.entregasPendentes > 0 ? 50 : 0}
                                    trend="Total"
                                    trendDirection="neutral"
                                    progressColor="bg-semantic-yellow"
                                    trendColor="yellow"
                                    icon={Truck}
                                    className="col-span-1"
                                    variant="compact"
                                />

                                {/* Entregas Realizadas - Green/Success */}
                                <KpiCard
                                    title="Entregues"
                                    value={metrics.entregasRealizadas.toString()}
                                    progress={100}
                                    trend="No Período"
                                    trendDirection="up"
                                    progressColor="bg-semantic-green"
                                    trendColor="green"
                                    icon={CheckCircle}
                                    className="col-span-1"
                                    variant="compact"
                                />
                            </div>

                            {/* Clients Header */}
                            <div className="flex items-center gap-2 mb-2 mt-6 px-1">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Clientes
                                </span>
                            </div>

                            {/* Clients Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Clientes Ativos - Purple */}
                                <KpiCard
                                    title="Clientes ativos"
                                    value={allContacts.filter(c => c.status === 'cliente').length.toString()}
                                    progress={100}
                                    trend="Total"
                                    trendDirection="neutral"
                                    progressColor="bg-violet-600"
                                    trendColor="primary"
                                    icon={Users}
                                    className="col-span-1"
                                    variant="compact"
                                    iconColor="text-violet-600 dark:text-violet-400"
                                />
                                {/* Pedido Fábrica - Orange - Clickable */}
                                <div onClick={() => navigate('/relatorio-fabrica')} className="cursor-pointer col-span-1">
                                    <KpiCard
                                        title="Pedido Fábrica"
                                        value="Gerar"
                                        progress={0}
                                        trend="Relatório"
                                        trendDirection="neutral"
                                        progressColor="bg-orange-500"
                                        trendColor="primary"
                                        icon={ClipboardList}
                                        className="h-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        variant="compact"
                                        iconColor="text-orange-500 dark:text-orange-400"
                                    />
                                </div>
                            </div>

                            {/* Alerts Section (Carousels) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div className="col-span-1">
                                    <AlertasFinanceiroWidget />
                                </div>
                                <div className="col-span-1">
                                    <AlertasRecompraWidget />
                                </div>
                                <div className="col-span-1">
                                    <TopIndicadoresWidget />
                                </div>
                                <div className="col-span-1">
                                    <UltimasVendasWidget />
                                </div>
                            </div>

                            {/* Logistics Widget */}
                            <LogisticsWidget
                                metrics={{
                                    entregasRealizadas: logisticsMetrics.entregasRealizadasHoje,
                                    entregasPendentes: logisticsMetrics.entregasPendentesTotal
                                }}
                            />
                        </>
                    )}

                </main>
            </div>
        </div>
    )
}