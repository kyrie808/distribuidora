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
    CheckCircle2,
    DollarSign,
    ShoppingCart
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { useDashboardFilter } from '../hooks/useDashboardFilter'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { AlertasFinanceiroWidget } from '@/components/dashboard/AlertasFinanceiroWidget'
import { AlertasRecompraWidget } from '@/components/dashboard/AlertasRecompraWidget'
import { TopIndicadoresWidget } from '@/components/dashboard/TopIndicadoresWidget'
import { UltimasVendasWidget } from '@/components/dashboard/UltimasVendasWidget'
import { MonthPicker } from '@/components/dashboard/MonthPicker'

export function Dashboard() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [userName, setUserName] = useState<string>('Comandante')
    const [greeting, setGreeting] = useState<string>('Olá')
    const { month, year, setMonth } = useDashboardFilter()
    const navigate = useNavigate()

    const { data: metrics, isLoading, refetch } = useDashboardMetrics(month, year)

    // Greeting & User Logic
    useEffect(() => {
        const fetchUserAndGreeting = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email) {
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
                const firstName = fullName?.split(' ')[0]
                if (firstName) setUserName(firstName)
            }

            const currentHour = new Date().getHours()
            if (currentHour >= 5 && currentHour < 12) setGreeting('Bom dia')
            else if (currentHour >= 12 && currentHour < 18) setGreeting('Boa tarde')
            else setGreeting('Boa noite')
        }

        fetchUserAndGreeting()
    }, [])

    // Derive selected month string for MonthPicker
    const selectedDate = new Date(year, month - 1, 1)
    const selectedMonthStr = selectedDate.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
        .replace('.', '')
        .replace(/^./, str => str.toUpperCase())

    const handleMonthSelect = (monthName: string) => {
        const monthsMap: { [key: string]: number } = {
            'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
            'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
        }
        const m = monthsMap[monthName]
        if (m !== undefined) {
            const currentYear = new Date().getFullYear()
            // Important: use current year or allow filter to handle year
            // For now, we follow the old logic of current year but use setMonth from filter
            setMonth(new Date(currentYear, m - 1, 1))
        }
    }

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await refetch()
        setIsRefreshing(false)
    }, [refetch])

    const totalAlerts = (metrics?.financial?.alertas_financeiros?.length || 0) + (metrics?.alertas_recompra?.length || 0)

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-[100dvh] flex justify-center">
            <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden max-w-screen-2xl shadow-2xl bg-background-light dark:bg-background-dark">

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

                    {/* Month Picker Navigation */}
                    <MonthPicker selectedMonth={selectedMonthStr} onMonthSelect={handleMonthSelect} />

                    {/* FINANCEIRO Section */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            $ FINANCEIRO
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KpiCard
                            title="Faturamento"
                            value={formatCurrency(metrics?.financial?.faturamento_mes_atual || 0)}
                            progress={100}
                            trend={`${metrics?.financial?.variacao_percentual?.toFixed(1) || 0}%`}
                            trendDirection={(metrics?.financial?.variacao_percentual || 0) >= 0 ? 'up' : 'down'}
                            icon={TrendingUp}
                            className="col-span-2 md:col-span-1"
                            variant="default"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="Ticket Médio"
                            value={formatCurrency(metrics?.financial?.ticket_medio_mes_atual || 0)}
                            progress={75}
                            trend="Estável"
                            trendDirection="neutral"
                            icon={ArrowUp}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="Lucro"
                            value={formatCurrency(metrics?.financial?.lucro_mes_atual || 0)}
                            progress={100}
                            trend="Est."
                            trendDirection="neutral"
                            icon={DollarSign}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="A Receber"
                            value={formatCurrency(metrics?.financial?.total_a_receber || 0)}
                            progress={50}
                            trend="Pendente"
                            trendDirection="neutral"
                            trendColor="yellow"
                            icon={TrendingDown}
                            className="col-span-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            variant="compact"
                            onClick={() => navigate('/vendas?pagamento=pendente')}
                            loading={isLoading}
                        />
                    </div>

                    {/* VENDAS & ENTREGAS Section */}
                    <div className="flex items-center gap-2 mb-2 mt-2 px-1">
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            🛒 VENDAS & ENTREGAS
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KpiCard
                            title="Vendas"
                            value={(metrics?.financial?.vendas_mes_atual || 0).toString()}
                            progress={70}
                            trend="Mês"
                            trendDirection="up"
                            icon={ShoppingBag}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="Itens"
                            value={(metrics?.operational?.total_itens || 0).toString()}
                            progress={65}
                            trend="Vol"
                            trendDirection="neutral"
                            icon={Package}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="Pendentes"
                            value={(metrics?.operational?.entregas_pendentes_total || 0).toString()}
                            progress={100}
                            trend="Total"
                            trendDirection="neutral"
                            icon={Truck}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />

                        <KpiCard
                            title="Entregues"
                            value={(metrics?.operational?.entregas_hoje_realizadas || 0).toString()}
                            progress={100}
                            trend="Hoje"
                            trendDirection="up"
                            icon={CheckCircle2}
                            className="col-span-1"
                            variant="compact"
                            loading={isLoading}
                        />
                    </div>

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <div className="space-y-8">
                            <AlertasFinanceiroWidget
                                data={metrics?.financial?.alertas_financeiros}
                                loading={isLoading}
                            />
                            <AlertasRecompraWidget
                                data={metrics?.alertas_recompra}
                                loading={isLoading}
                            />
                        </div>

                        <div className="space-y-8">
                            <TopIndicadoresWidget
                                data={metrics?.operational?.ranking_indicacoes}
                                loading={isLoading}
                            />
                            <UltimasVendasWidget
                                data={metrics?.operational?.ultimas_vendas}
                                loading={isLoading}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
