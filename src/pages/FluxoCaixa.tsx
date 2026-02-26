import { useState, useMemo, useEffect } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { Header } from '../components/layout/Header'
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    DollarSign,
    Clock,
    Receipt,
    TrendingUp,
    Filter,
    Settings,
    Wallet,
    LayoutGrid,
    ChevronRight,
    ChevronLeft,
    Building2,
    FileText,
    BarChart3
} from 'lucide-react'
import { MonthPicker } from '../components/dashboard/MonthPicker'
import { useFluxoCaixa } from '../hooks/useFluxoCaixa'
import { useExtrato } from '../hooks/useExtrato'
import { useExtratoDeSaldo } from '../hooks/useExtratoDeSaldo'
import { useContas } from '../hooks/useContas'
import { usePlanoDeContas } from '../hooks/usePlanoDeContas'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LancamentoModal } from '../components/features/financeiro/LancamentoModal'
import { TransferenciaModal } from '../components/features/financeiro/TransferenciaModal'
import { PlanoContaModal } from '../components/features/financeiro/PlanoContaModal'
import { ContaModal } from '../components/features/financeiro/ContaModal'
import { Badge, Button } from '../components/ui'

type HubTab = 'financeiro' | 'configuracoes'
type SettingsTab = 'contas' | 'categorias'

export function FluxoCaixa() {
    const [activeHubTab, setActiveHubTab] = useState<HubTab>('financeiro')
    const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('contas')
    const [selectedMonth, setSelectedMonth] = useState(new Date())

    // Hooks
    const { resumo, isLoading: loadingResumo, refetch: refetchResumo } = useFluxoCaixa(selectedMonth)
    const { extrato, isLoading: loadingExtrato, refetch: refetchExtrato } = useExtrato(selectedMonth)
    const { contas, isLoading: loadingContas, refetch: refetchContas } = useContas()
    const { planoContas, isLoading: loadingPlano, refetch: refetchPlano } = usePlanoDeContas()
    const { extratoDeSaldo, isLoading: loadingExtratoDeSaldo, refetch: refetchExtratoDeSaldo } = useExtratoDeSaldo()

    // Modal States
    const [isEntradaOpen, setIsEntradaOpen] = useState(false)
    const [isSaidaOpen, setIsSaidaOpen] = useState(false)
    const [isTransferenciaOpen, setIsTransferenciaOpen] = useState(false)
    const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false)
    const [isContaModalOpen, setIsContaModalOpen] = useState(false)
    const [isFabOpen, setIsFabOpen] = useState(false)

    // Pagination
    const [paginaAtual, setPaginaAtual] = useState(1)
    const itensPorPagina = 10

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

    // Reset pagination when month changes
    useEffect(() => {
        setPaginaAtual(1)
    }, [selectedMonth])

    const totalPaginas = Math.ceil(extrato.length / itensPorPagina)
    const extratosPaginados = extrato.slice(
        (paginaAtual - 1) * itensPorPagina,
        paginaAtual * itensPorPagina
    )

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
                            {/* Month Selector & Global Balance */}
                            <div className="flex flex-col gap-4">
                                <MonthPicker
                                    selectedMonth={selectedMonthStr}
                                    onMonthSelect={handleMonthSelect}
                                />

                                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-200 rounded-3xl p-6 shadow-xl text-white dark:text-zinc-950">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Saldo em Contas</p>
                                            <h2 className="text-3xl font-black mt-1">
                                                {loadingContas ? '...' : formatCurrency(totalSaldoContas)}
                                            </h2>
                                        </div>
                                        <div className="p-3 bg-white/10 dark:bg-black/5 rounded-2xl">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4 border-t border-white/10 dark:border-black/5">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Entradas ({format(selectedMonth, 'MMM', { locale: ptBR })})</p>
                                            <p className="text-sm font-bold text-emerald-400 dark:text-emerald-600">
                                                + {formatCurrency(resumo?.total_entradas || 0)}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Saídas ({format(selectedMonth, 'MMM', { locale: ptBR })})</p>
                                            <p className="text-sm font-bold text-red-400 dark:text-red-600">
                                                - {formatCurrency(resumo?.total_saidas || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick KPIs Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { label: 'Saldo do Mês', value: (resumo?.total_entradas || 0) - (resumo?.total_saidas || 0), icon: TrendingUp, color: 'emerald' },
                                    { label: 'A Receber', value: resumo?.total_a_receber || 0, icon: Clock, color: 'orange' },
                                    {
                                        label: 'Inadimplência',
                                        value: (resumo?.total_faturamento || 0) > 0
                                            ? Math.min(((resumo?.total_a_receber || 0) / (resumo?.total_faturamento || 1)) * 100, 100)
                                            : 0,
                                        isPercent: true,
                                        icon: Filter,
                                        color: 'red'
                                    },
                                ].map((kpi, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3", `bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-600 dark:text-${kpi.color}-400`)}>
                                            <kpi.icon size={20} />
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-1">
                                            {loadingResumo ? '...' : kpi.isPercent ? `${kpi.value.toFixed(1)}%` : formatCurrency(kpi.value)}
                                        </h3>
                                    </div>
                                ))}
                            </div>

                            {/* Extrato Mensal Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Receipt className="w-4 h-4" /> Extrato do Mês
                                    </h2>
                                    {!loadingExtrato && extrato.length > 0 && (
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                            {extrato.length} lançamentos
                                        </span>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                                    {loadingExtrato ? (
                                        <div className="p-12 flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase">Sincronizando lançamentos...</p>
                                        </div>
                                    ) : extrato.length === 0 ? (
                                        <div className="p-16 text-center">
                                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-700">
                                                <Filter className="w-8 h-8 text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400 uppercase">Nenhum lançamento registrado</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                {extratosPaginados.map((item: any) => (
                                                    <div key={item.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                                                item.tipo === 'receita' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30" :
                                                                    item.tipo === 'despesa' ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" :
                                                                        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                                                            )}>
                                                                {item.tipo === 'receita' ? <ArrowUpRight className="w-6 h-6" /> :
                                                                    item.tipo === 'despesa' ? <ArrowDownLeft className="w-6 h-6" /> :
                                                                        <ArrowRightLeft className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{item.descricao}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                                                        {format(new Date(item.data + 'T12:00:00'), 'dd/MM')}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-zinc-200 dark:border-zinc-700 text-zinc-500">
                                                                        {item.categoria_nome || 'Lançamento'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={cn(
                                                                "text-base font-black tracking-tight",
                                                                item.tipo === 'receita' ? "text-emerald-600 dark:text-emerald-400" :
                                                                    item.tipo === 'despesa' ? "text-red-600 dark:text-red-400" :
                                                                        "text-zinc-900 dark:text-white"
                                                            )}>
                                                                {item.tipo === 'despesa' ? '- ' : item.tipo === 'receita' ? '+ ' : ''}{formatCurrency(item.valor || 0)}
                                                            </p>
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.origem}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {totalPaginas > 1 && (
                                                <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
                                                    <button
                                                        onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                                                        disabled={paginaAtual === 1}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:text-zinc-900 dark:hover:text-white transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" /> Anterior
                                                    </button>
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                                        Página {paginaAtual} de {totalPaginas}
                                                    </span>
                                                    <button
                                                        onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                                                        disabled={paginaAtual === totalPaginas}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:text-zinc-900 dark:hover:text-white transition-colors"
                                                    >
                                                        Próxima <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Extrato de Saldo Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" /> Extrato de Saldo
                                    </h2>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                                    {loadingExtratoDeSaldo ? (
                                        <div className="p-12 flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase">Calculando saldos...</p>
                                        </div>
                                    ) : extratoDeSaldo.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <p className="text-sm font-bold text-zinc-400 uppercase">Nenhum dado disponível</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                                        <th className="text-left px-5 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Mês</th>
                                                        <th className="text-right px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Entradas</th>
                                                        <th className="text-right px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Saídas</th>
                                                        <th className="text-right px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Saldo Mês</th>
                                                        <th className="text-right px-5 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Acumulado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                                    {extratoDeSaldo.map((row) => {
                                                        const saldoMes = Number(row.saldo_mes) || 0
                                                        const saldoAcum = Number(row.saldo_acumulado) || 0
                                                        return (
                                                            <tr key={row.mes_ordem} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                                <td className="px-5 py-4 text-sm font-black text-zinc-900 dark:text-white">{row.mes}</td>
                                                                <td className="px-4 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                                                                    {formatCurrency(Number(row.entradas) || 0)}
                                                                </td>
                                                                <td className="px-4 py-4 text-sm font-bold text-red-600 dark:text-red-400 text-right whitespace-nowrap">
                                                                    {formatCurrency(Number(row.saidas) || 0)}
                                                                </td>
                                                                <td className={cn(
                                                                    "px-4 py-4 text-sm font-bold text-right whitespace-nowrap",
                                                                    saldoMes >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                                )}>
                                                                    {saldoMes >= 0 ? '+' : ''}{formatCurrency(saldoMes)}
                                                                </td>
                                                                <td className="px-5 py-4 text-sm font-black text-zinc-900 dark:text-white text-right whitespace-nowrap">
                                                                    {formatCurrency(saldoAcum)}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Reconciliation Card */}
                                {!loadingExtratoDeSaldo && extratoDeSaldo.length > 0 && (() => {
                                    const saldoAcumulado = Number(extratoDeSaldo[0]?.saldo_acumulado) || 0
                                    const diferenca = saldoAcumulado - totalSaldoContas
                                    const reconciliado = Math.abs(diferenca) < 0.01
                                    return (
                                        <div className={cn(
                                            "p-5 rounded-[1.5rem] border flex flex-col sm:flex-row sm:items-center gap-3",
                                            reconciliado
                                                ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30"
                                                : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
                                        )}>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">Saldo Acumulado</p>
                                                    <p className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(saldoAcumulado)}</p>
                                                </div>
                                                <div className="hidden sm:block w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">Saldo em Contas</p>
                                                    <p className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(totalSaldoContas)}</p>
                                                </div>
                                                <div className="hidden sm:block w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">Diferença</p>
                                                    <p className={cn(
                                                        "text-sm font-black",
                                                        reconciliado ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                    )}>
                                                        {formatCurrency(Math.abs(diferenca))} {reconciliado ? '✅' : '⚠️'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </section>
                        </div>
                    ) : (
                        <div className="px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Settings Sub-tabs */}
                            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'contas', label: 'Contas Bancárias', icon: Building2 },
                                    { id: 'categorias', label: 'Plano de Contas', icon: LayoutGrid },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSettingsTab(tab.id as SettingsTab)}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap",
                                            activeSettingsTab === tab.id
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg shadow-zinc-900/10"
                                                : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeSettingsTab === 'contas' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Minhas Contas</h2>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase"
                                            onClick={() => setIsContaModalOpen(true)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Nova Conta
                                        </Button>
                                    </div>

                                    <div className="grid gap-4">
                                        {loadingContas ? (
                                            <div className="p-8 text-center text-zinc-400 animate-pulse uppercase font-black text-xs">Carregando contas...</div>
                                        ) : contas.map(conta => (
                                            <div key={conta.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{conta.nome}</h3>
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{conta.banco}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black text-zinc-900 dark:text-white">{formatCurrency(conta.saldo_atual ?? 0)}</p>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Ativo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Categorias</h2>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase"
                                            onClick={() => setIsPlanoModalOpen(true)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Nova Categoria
                                        </Button>
                                    </div>

                                    <div className="grid gap-3">
                                        {loadingPlano ? (
                                            <div className="p-8 text-center text-zinc-400 animate-pulse uppercase font-black text-xs">Sincronizando categorias...</div>
                                        ) : planoContas.map(item => (
                                            <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                                        item.tipo === 'receita' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{item.nome}</h4>
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{item.tipo}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Backdrop for FAB */}
                    {isFabOpen && activeHubTab === 'financeiro' && (
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
                            onClick={() => setIsFabOpen(false)}
                        />
                    )}

                    {/* Floating Action Buttons Area */}
                    {activeHubTab === 'financeiro' && (
                        <div className="fixed right-6 bottom-24 flex flex-col items-end gap-3 z-50">
                            <div className={cn(
                                "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom",
                                isFabOpen ? "scale-100 opacity-100 mb-2" : "scale-0 opacity-0 h-0 pointer-events-none"
                            )}>
                                <div className="flex items-center gap-3">
                                    <span className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                        Transferência
                                    </span>
                                    <button
                                        onClick={() => { setIsTransferenciaOpen(true); setIsFabOpen(false); }}
                                        className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <ArrowRightLeft size={24} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                        Saída
                                    </span>
                                    <button
                                        onClick={() => { setIsSaidaOpen(true); setIsFabOpen(false); }}
                                        className="w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <ArrowDownLeft size={24} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                        Entrada
                                    </span>
                                    <button
                                        onClick={() => { setIsEntradaOpen(true); setIsFabOpen(false); }}
                                        className="w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <ArrowUpRight size={24} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsFabOpen(!isFabOpen)}
                                className={cn(
                                    "w-14 h-14 text-white rounded-full shadow-lg shadow-zinc-400 dark:shadow-none flex items-center justify-center hover:scale-110 active:scale-95 transition-all",
                                    isFabOpen ? "bg-zinc-800 rotate-45 shadow-none" : "bg-zinc-900 dark:bg-white dark:text-zinc-900"
                                )}
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    )}

                    {/* Modals */}
                    <LancamentoModal
                        type="entrada"
                        isOpen={isEntradaOpen}
                        onClose={() => setIsEntradaOpen(false)}
                        onSuccess={refreshAll}
                    />
                    <LancamentoModal
                        type="saida"
                        isOpen={isSaidaOpen}
                        onClose={() => setIsSaidaOpen(false)}
                        onSuccess={refreshAll}
                    />
                    <TransferenciaModal
                        isOpen={isTransferenciaOpen}
                        onClose={() => setIsTransferenciaOpen(false)}
                        onSuccess={refreshAll}
                    />
                    <PlanoContaModal
                        isOpen={isPlanoModalOpen}
                        onClose={() => setIsPlanoModalOpen(false)}
                        onSuccess={refreshAll}
                    />
                    <ContaModal
                        isOpen={isContaModalOpen}
                        onClose={() => setIsContaModalOpen(false)}
                        onSuccess={refreshAll}
                    />
                </PageContainer>
            </div>
        </div>
    )
}
