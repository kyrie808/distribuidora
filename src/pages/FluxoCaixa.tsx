import { useState, useMemo } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { Header } from '../components/layout/Header'
import { DollarSign, Settings } from 'lucide-react'
import { useFluxoCaixa } from '../hooks/useFluxoCaixa'
import { useExtrato } from '../hooks/useExtrato'
import { useExtratoDeSaldo } from '../hooks/useExtratoDeSaldo'
import { useContas } from '../hooks/useContas'
import { usePlanoDeContas } from '../hooks/usePlanoDeContas'
import { cn } from '@/lib/utils'

// Refactored Sub-components
import { FinanceiroResumo } from '../components/features/financeiro/FinanceiroResumo'
import { ExtratoMensal } from '../components/features/financeiro/ExtratoMensal'
import { ExtratoSaldoAcumulado } from '../components/features/financeiro/ExtratoSaldoAcumulado'
import { FinanceiroConfig } from '../components/features/financeiro/FinanceiroConfig'
import { FinanceiroFab } from '../components/features/financeiro/FinanceiroFab'

type HubTab = 'financeiro' | 'configuracoes'

export function FluxoCaixa() {
    const [activeHubTab, setActiveHubTab] = useState<HubTab>('financeiro')
    const [selectedMonth, setSelectedMonth] = useState(new Date())

    // Hooks
    const { resumo, isLoading: loadingResumo, refetch: refetchResumo } = useFluxoCaixa(selectedMonth)
    const { extrato, isLoading: loadingExtrato, refetch: refetchExtrato } = useExtrato(selectedMonth)
    const { contas, isLoading: loadingContas, refetch: refetchContas } = useContas()
    const { planoContas, isLoading: loadingPlano, refetch: refetchPlano } = usePlanoDeContas()
    const { extratoDeSaldo, isLoading: loadingExtratoDeSaldo, refetch: refetchExtratoDeSaldo } = useExtratoDeSaldo()

    // Month Picker Helper
    const selectedMonthStr = selectedMonth.toLocaleString('pt-BR', { month: 'short' })
        .replace('.', '')
        .charAt(0).toUpperCase() + selectedMonth.toLocaleString('pt-BR', { month: 'short' }).slice(1).replace('.', '')

    const handleMonthSelect = (monthName: string) => {
        const monthsMap: { [key: string]: number } = {
            'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
            'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
        }
        const m = monthsMap[monthName]
        if (m !== undefined) {
            setSelectedMonth(new Date(selectedMonth.getFullYear(), m, 1))
        }
    }

    const refreshAll = () => {
        refetchResumo()
        refetchExtrato()
        refetchContas()
        refetchPlano()
        refetchExtratoDeSaldo()
    }

    const totalSaldoContas = useMemo(() => {
        return contas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0)
    }, [contas])

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header title="Financeiro" showBack centerTitle />
                <PageContainer className="pt-0 pb-32 bg-transparent px-4">

                    {/* Hub Tabs Navigation */}
                    <div className="px-4 mt-4">
                        <div className="flex bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setActiveHubTab('financeiro')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                                    activeHubTab === 'financeiro'
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                <DollarSign className="w-4 h-4" />
                                Fluxo de Caixa
                            </button>
                            <button
                                onClick={() => setActiveHubTab('configuracoes')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                                    activeHubTab === 'configuracoes'
                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                <Settings className="w-4 h-4" />
                                Configurações
                            </button>
                        </div>
                    </div>

                    {activeHubTab === 'financeiro' ? (
                        <div className="px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <FinanceiroResumo
                                selectedMonth={selectedMonth}
                                selectedMonthStr={selectedMonthStr}
                                onMonthSelect={handleMonthSelect}
                                resumo={resumo ?? null}
                                totalSaldoContas={totalSaldoContas}
                                loadingResumo={loadingResumo}
                                loadingContas={loadingContas}
                            />

                            <ExtratoMensal 
                                key={selectedMonth.toISOString()}
                                extrato={extrato} 
                                loadingExtrato={loadingExtrato} 
                            />

                            <ExtratoSaldoAcumulado 
                                extratoDeSaldo={extratoDeSaldo} 
                                loadingExtratoDeSaldo={loadingExtratoDeSaldo} 
                                totalSaldoContas={totalSaldoContas}
                            />
                        </div>
                    ) : (
                        <FinanceiroConfig 
                            contas={contas}
                            planoContas={planoContas}
                            loadingContas={loadingContas}
                            loadingPlano={loadingPlano}
                            refreshAll={refreshAll}
                        />
                    )}

                    {activeHubTab === 'financeiro' && (
                        <FinanceiroFab refreshAll={refreshAll} />
                    )}
                </PageContainer>
            </div>
        </div>
    )
}
