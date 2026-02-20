import { useState } from 'react'
import {
    Trophy,
    Users,
    TrendingUp,
    ShoppingBag,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { KpiCard } from '../components/dashboard/KpiCard'
import { useIndicacoes } from '../hooks/useIndicacoes'
import { TopIndicadoresWidget } from '../components/dashboard/TopIndicadoresWidget'
import { RankingComprasWidget } from '../components/dashboard/RankingComprasWidget'
import { cn } from '../lib/utils'

type TabType = 'compras' | 'indicacoes'

export function Indicacoes() {
    const { totalIndicacoes, totalConversoes } = useIndicacoes()
    const [activeTab, setActiveTab] = useState<TabType>('compras')

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-8">
                <Header
                    title="Ranking Mont"
                    showBack
                    centerTitle
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />
                <PageContainer className="pt-0 pb-16 bg-transparent px-4">
                    {/* Metrics / KPI Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <KpiCard
                            title="Indicados"
                            value={totalIndicacoes.toString()}
                            progress={100}
                            trend="Total"
                            trendDirection="up"
                            icon={Users}
                            progressColor="bg-primary"
                            trendColor="green"
                            iconColor="text-primary"
                            variant="compact"
                        />
                        <KpiCard
                            title="Vendas"
                            value={totalConversoes.toString()}
                            progress={totalIndicacoes > 0 ? (totalConversoes / totalIndicacoes) * 100 : 0}
                            trend={totalIndicacoes > 0 ? `${((totalConversoes / totalIndicacoes) * 100).toFixed(0)}%` : '0%'}
                            trendDirection="up"
                            icon={TrendingUp}
                            progressColor="bg-semantic-green"
                            trendColor="green"
                            iconColor="text-semantic-green"
                            variant="compact"
                        />
                        <KpiCard
                            title="Top"
                            value="Mont"
                            progress={100}
                            trend="Elite"
                            trendDirection="up"
                            icon={Trophy}
                            progressColor="bg-semantic-yellow"
                            trendColor="yellow"
                            iconColor="text-semantic-yellow"
                            variant="compact"
                        />
                    </div>

                    {/* Apple-like Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('compras')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                                activeTab === 'compras'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            )}
                        >
                            <ShoppingBag className="size-4" />
                            Compras
                        </button>
                        <button
                            onClick={() => setActiveTab('indicacoes')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
                                activeTab === 'indicacoes'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            )}
                        >
                            <Users className="size-4" />
                            Indicações
                        </button>
                    </div>

                    {/* Ranking Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'compras' ? (
                            <RankingComprasWidget />
                        ) : (
                            <TopIndicadoresWidget />
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Trophy className="size-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Programa Embaixadores Mont</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    Nossos top clientes e indicadores recebem benefícios exclusivos.
                                    Cada R$ 1,00 em pedidos entregues e pagos equivale a 1 ponto no ranking.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </div>
        </div>
    )
}
